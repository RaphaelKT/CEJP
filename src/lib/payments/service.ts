import 'server-only';
import { randomUUID } from 'node:crypto';
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { publish } from '@/lib/realtime/bus';
import { recalcularContadores } from '@/lib/stats';
import { getGateway } from './gateway';
import { quote } from './pricing';
import { GatewayError, type ChargeResult } from './types';

/* ------------------------------------------------------------------ */
/*  Máquina de estados                                                 */
/* ------------------------------------------------------------------ */

/** Transições permitidas — qualquer outra é rejeitada e auditada. */
const TRANSICOES: Record<PaymentStatus, PaymentStatus[]> = {
  CRIADO: ['PENDENTE', 'EM_ANALISE', 'AUTORIZADO', 'CAPTURADO', 'RECUSADO', 'CANCELADO', 'EXPIRADO'],
  PENDENTE: ['EM_ANALISE', 'AUTORIZADO', 'CAPTURADO', 'RECUSADO', 'CANCELADO', 'EXPIRADO'],
  EM_ANALISE: ['AUTORIZADO', 'CAPTURADO', 'RECUSADO', 'CANCELADO'],
  AUTORIZADO: ['CAPTURADO', 'CANCELADO', 'EXPIRADO'],
  CAPTURADO: ['ESTORNADO_PARCIAL', 'ESTORNADO_TOTAL', 'CHARGEBACK'],
  RECUSADO: ['CRIADO'],
  CANCELADO: [],
  EXPIRADO: [],
  ESTORNADO_PARCIAL: ['ESTORNADO_TOTAL', 'CHARGEBACK'],
  ESTORNADO_TOTAL: ['CHARGEBACK'],
  CHARGEBACK: [],
};

export function podeTransitar(de: PaymentStatus, para: PaymentStatus) {
  return de === para || (TRANSICOES[de] ?? []).includes(para);
}

const STATUS_PAGO: PaymentStatus[] = ['CAPTURADO'];

/* ------------------------------------------------------------------ */
/*  Códigos legíveis                                                   */
/* ------------------------------------------------------------------ */

function sequencia() {
  return Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 900 + 100);
}

export const gerarCodigoPedido = () => `PED-${new Date().getFullYear()}-${sequencia()}`;
export const gerarCodigoPagamento = () => `PAG-${sequencia()}`;
export const gerarCodigoInscricao = (sigla: string) => `${sigla}-${sequencia()}`;

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export type CheckoutParams = {
  editionSlug: string;
  tierId: string;
  quantity: number;
  buyer: { name: string; email: string; phone: string; document: string };
  participants: {
    name: string;
    email: string;
    phone?: string;
    birthDate?: string;
    shirtSize?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    healthNotes?: string;
    dietaryNotes?: string;
  }[];
  method: PaymentMethod;
  installments: number;
  couponCode?: string;
  cardToken?: string;
  idempotencyKey: string;
  userId?: string | null;
};

export type CheckoutResult = {
  orderCode: string;
  paymentCode: string;
  status: PaymentStatus;
  totalCents: number;
  method: PaymentMethod;
  pix?: { qrCode: string; qrCodeBase64?: string; expiresAt?: Date };
  boleto?: { url?: string; barcode?: string; dueDate?: Date };
  card?: { brand?: string; last4?: string; authorizationCode?: string };
  redirectUrl?: string;
  failureMessage?: string;
  registrationCodes: string[];
};

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * Fluxo transacional de compra.
 *
 * 1. Idempotência (evita pedido duplicado em double-click / retry de rede)
 * 2. Reserva de vagas com trava otimista (`quantitySold` condicionado)
 * 3. Precificação no servidor — o preço enviado pelo cliente é ignorado
 * 4. Criação de pedido + inscrições + pagamento
 * 5. Cobrança no gateway (fora da transação — chamada de rede)
 * 6. Conciliação do resultado + lançamentos contábeis
 */
export async function processarCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  const existente = await prisma.order.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 }, registrations: true },
  });
  if (existente) {
    const pagamento = existente.payments[0];
    return {
      orderCode: existente.code,
      paymentCode: pagamento?.code ?? '',
      status: pagamento?.status ?? 'PENDENTE',
      totalCents: existente.totalCents,
      method: pagamento?.method ?? params.method,
      pix: pagamento?.pixQrCode
        ? { qrCode: pagamento.pixQrCode, qrCodeBase64: pagamento.pixQrCodeBase64 ?? undefined, expiresAt: pagamento.pixExpiresAt ?? undefined }
        : undefined,
      boleto: pagamento?.boletoUrl
        ? { url: pagamento.boletoUrl, barcode: pagamento.boletoBarcode ?? undefined, dueDate: pagamento.boletoDueDate ?? undefined }
        : undefined,
      registrationCodes: existente.registrations.map((r) => r.code),
    };
  }

  if (params.participants.length !== params.quantity) {
    throw new CheckoutError('A quantidade de participantes não confere com as vagas escolhidas.', 'QUANTIDADE_INVALIDA');
  }

  const tier = await prisma.ticketTier.findUnique({
    where: { id: params.tierId },
    include: { edition: { include: { event: true } } },
  });
  if (!tier || !tier.active) throw new CheckoutError('Categoria de inscrição indisponível.', 'LOTE_INDISPONIVEL');
  if (tier.edition.slug !== params.editionSlug) throw new CheckoutError('Lote não pertence a esta edição.', 'LOTE_INVALIDO');
  if (tier.edition.status !== 'INSCRICOES_ABERTAS') {
    throw new CheckoutError('As inscrições para este evento não estão abertas.', 'INSCRICOES_FECHADAS');
  }
  const agora = new Date();
  if (tier.salesStartAt && tier.salesStartAt > agora) throw new CheckoutError('Este lote ainda não abriu.', 'LOTE_NAO_ABERTO');
  if (tier.salesEndAt && tier.salesEndAt < agora) throw new CheckoutError('Este lote já foi encerrado.', 'LOTE_ENCERRADO');
  if (params.quantity < tier.minPerOrder || params.quantity > tier.maxPerOrder) {
    throw new CheckoutError(`Este lote aceita de ${tier.minPerOrder} a ${tier.maxPerOrder} inscrições por pedido.`, 'QUANTIDADE_FORA_DA_FAIXA');
  }

  const cupom = params.couponCode
    ? await prisma.coupon.findFirst({
        where: {
          code: params.couponCode,
          active: true,
          OR: [{ endsAt: null }, { endsAt: { gte: agora } }],
        },
      })
    : null;
  if (params.couponCode && !cupom) throw new CheckoutError('Cupom inválido ou expirado.', 'CUPOM_INVALIDO');
  if (cupom?.maxRedemptions && cupom.redemptions >= cupom.maxRedemptions) {
    throw new CheckoutError('Este cupom atingiu o limite de usos.', 'CUPOM_ESGOTADO');
  }

  const subtotal = tier.priceCents * params.quantity;
  const orcamento = quote({
    subtotalCents: subtotal,
    method: params.method,
    installments: params.installments,
    coupon: cupom,
  });

  const orderCode = gerarCodigoPedido();
  const siglaEvento = tier.edition.event.slug.slice(0, 3).toUpperCase() + String(tier.edition.year).slice(-2);

  // ---- Transação: reserva de vagas + pedido + inscrições + pagamento ----
  const { order, payment, registrationCodes } = await prisma.$transaction(async (tx) => {
    // Trava otimista: só reserva se ainda houver vagas.
    const reserva = await tx.ticketTier.updateMany({
      where: {
        id: tier.id,
        OR: [
          { quantityTotal: 0 }, // 0 = ilimitado
          { quantitySold: { lte: tier.quantityTotal - params.quantity } },
        ],
      },
      data: { quantitySold: { increment: params.quantity } },
    });
    if (reserva.count === 0) throw new CheckoutError('As vagas deste lote acabaram de esgotar.', 'ESGOTADO', 409);

    await tx.eventEdition.update({
      where: { id: tier.editionId },
      data: { soldCount: { increment: params.quantity } },
    });

    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: params.userId ?? undefined,
        status: 'AGUARDANDO_PAGAMENTO',
        buyerName: params.buyer.name,
        buyerEmail: params.buyer.email,
        buyerPhone: params.buyer.phone,
        buyerDocLast4: params.buyer.document.slice(-4),
        currency: tier.currency,
        subtotalCents: orcamento.subtotalCents,
        discountCents: orcamento.discountCents,
        feeCents: orcamento.interestCents,
        totalCents: orcamento.totalCents,
        couponId: cupom?.id,
        idempotencyKey: params.idempotencyKey,
        expiresAt: new Date(Date.now() + 60 * 60_000),
        metadata: {
          editionSlug: tier.edition.slug,
          tierSlug: tier.slug,
          orcamento: orcamento as unknown as Prisma.InputJsonValue,
        },
        items: {
          create: [
            {
              editionId: tier.editionId,
              tierId: tier.id,
              kind: 'INSCRICAO',
              description: `${tier.edition.title} — ${tier.name}`,
              quantity: params.quantity,
              unitPriceCents: tier.priceCents,
              totalCents: subtotal,
            },
          ],
        },
      },
    });

    const registrationCodes: string[] = [];
    for (const [idx, p] of params.participants.entries()) {
      const code = `${siglaEvento}-${sequencia()}${idx}`;
      registrationCodes.push(code);
      const nascimento = p.birthDate ? new Date(p.birthDate) : null;
      const menor = nascimento ? Date.now() - nascimento.getTime() < 18 * 31_557_600_000 : false;
      await tx.registration.create({
        data: {
          code,
          editionId: tier.editionId,
          tierId: tier.id,
          userId: params.userId ?? undefined,
          orderId: order.id,
          status: 'AGUARDANDO_PAGAMENTO',
          participantName: p.name,
          participantEmail: p.email,
          participantPhone: p.phone,
          participantBirth: nascimento,
          emergencyContact: p.emergencyContact,
          emergencyPhone: p.emergencyPhone,
          healthNotes: p.healthNotes,
          dietaryNotes: p.dietaryNotes,
          shirtSize: p.shirtSize,
          isMinor: menor,
          qrCodePayload: `${code}.${randomUUID()}`,
        },
      });
    }

    if (cupom) {
      await tx.coupon.update({ where: { id: cupom.id }, data: { redemptions: { increment: 1 } } });
    }

    const payment = await tx.payment.create({
      data: {
        code: gerarCodigoPagamento(),
        orderId: order.id,
        provider: getGateway().provider,
        method: params.method,
        status: 'CRIADO',
        amountCents: orcamento.totalCents,
        currency: tier.currency,
        installments: orcamento.installments,
        idempotencyKey: `${params.idempotencyKey}:pay`,
        metadata: { plano: orcamento.installmentPlan as unknown as Prisma.InputJsonValue },
      },
    });

    return { order, payment, registrationCodes };
  });

  // ---- Cobrança no gateway (rede — fora da transação) ----
  const gateway = getGateway();
  const inicio = Date.now();
  let resultado: ChargeResult;
  try {
    resultado = await gateway.charge({
      orderCode: order.code,
      amountCents: orcamento.totalCents,
      currency: order.currency,
      method: params.method,
      installments: orcamento.installments,
      description: `${tier.edition.title} — ${tier.name} (${params.quantity}x)`,
      idempotencyKey: payment.idempotencyKey!,
      payer: {
        name: params.buyer.name,
        email: params.buyer.email,
        phone: params.buyer.phone,
        document: params.buyer.document,
        documentType: params.buyer.document.length === 14 ? 'CNPJ' : 'CPF',
      },
      cardToken: params.cardToken,
      notificationUrl: `${env.APP_URL}/api/webhooks/pagamentos/${gateway.provider.toLowerCase().replace('_', '-')}`,
      metadata: { orderId: order.id, editionId: tier.editionId },
    });
  } catch (error) {
    const msg = error instanceof GatewayError ? error.message : 'Falha ao comunicar com o provedor de pagamento.';
    await registrarTentativa(payment.id, payment.status, 'RECUSADO', 'checkout', Date.now() - inicio, {
      erro: msg,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'RECUSADO', failedAt: new Date(), failureMessage: msg, failureCode: 'ERRO_GATEWAY' },
    });
    await liberarVagas(tier.id, tier.editionId, params.quantity, order.id, 'falha_gateway');
    throw new CheckoutError(msg, 'ERRO_GATEWAY', 502);
  }

  await registrarTentativa(payment.id, payment.status, resultado.status, 'checkout', Date.now() - inicio, {
    providerStatus: resultado.providerStatusRaw,
  });

  const atualizado = await aplicarResultado(payment.id, resultado);

  if (resultado.status === 'RECUSADO') {
    await liberarVagas(tier.id, tier.editionId, params.quantity, order.id, 'pagamento_recusado');
  }

  return {
    orderCode: order.code,
    paymentCode: payment.code,
    status: atualizado.status,
    totalCents: orcamento.totalCents,
    method: params.method,
    pix: resultado.pixQrCode
      ? { qrCode: resultado.pixQrCode, qrCodeBase64: resultado.pixQrCodeBase64, expiresAt: resultado.pixExpiresAt }
      : undefined,
    boleto: resultado.boletoUrl
      ? { url: resultado.boletoUrl, barcode: resultado.boletoBarcode, dueDate: resultado.boletoDueDate }
      : undefined,
    card: resultado.cardLast4
      ? { brand: resultado.cardBrand, last4: resultado.cardLast4, authorizationCode: resultado.authorizationCode }
      : undefined,
    redirectUrl: resultado.redirectUrl,
    failureMessage: resultado.failureMessage,
    registrationCodes,
  };
}

async function liberarVagas(tierId: string, editionId: string, qtd: number, orderId: string, motivo: string) {
  await prisma.$transaction([
    prisma.ticketTier.update({ where: { id: tierId }, data: { quantitySold: { decrement: qtd } } }),
    prisma.eventEdition.update({ where: { id: editionId }, data: { soldCount: { decrement: qtd } } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELADO', canceledAt: new Date(), cancelReason: motivo },
    }),
    prisma.registration.updateMany({ where: { orderId }, data: { status: 'CANCELADA', cancelReason: motivo } }),
  ]);
}

async function registrarTentativa(
  paymentId: string,
  de: PaymentStatus,
  para: PaymentStatus,
  source: string,
  latencyMs: number,
  payload?: Record<string, unknown>,
) {
  await prisma.paymentAttempt.create({
    data: {
      paymentId,
      fromStatus: de,
      toStatus: para,
      source,
      latencyMs,
      responsePayload: (payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Aplica o resultado do gateway ao pagamento e propaga para pedido,
 * inscrições, razão contábil e contadores públicos.
 * Idempotente: reprocessar o mesmo evento não duplica lançamentos.
 */
export async function aplicarResultado(paymentId: string, resultado: ChargeResult, source = 'checkout') {
  const atual = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: true } });

  if (!podeTransitar(atual.status, resultado.status)) {
    await prisma.paymentAttempt.create({
      data: {
        paymentId,
        fromStatus: atual.status,
        toStatus: resultado.status,
        source,
        errorCode: 'TRANSICAO_INVALIDA',
      },
    });
    return atual;
  }
  if (atual.status === resultado.status && atual.providerPaymentId) return atual;

  const capturado = STATUS_PAGO.includes(resultado.status);

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: resultado.status,
      providerPaymentId: resultado.providerPaymentId,
      providerStatusRaw: resultado.providerStatusRaw,
      capturedCents: resultado.capturedCents,
      providerFeeCents: resultado.providerFeeCents,
      netCents: resultado.capturedCents - resultado.providerFeeCents,
      pixQrCode: resultado.pixQrCode,
      pixQrCodeBase64: resultado.pixQrCodeBase64,
      pixExpiresAt: resultado.pixExpiresAt,
      boletoUrl: resultado.boletoUrl,
      boletoBarcode: resultado.boletoBarcode,
      boletoDueDate: resultado.boletoDueDate,
      cardBrand: resultado.cardBrand,
      cardLast4: resultado.cardLast4,
      authorizationCode: resultado.authorizationCode,
      failureCode: resultado.failureCode,
      failureMessage: resultado.failureMessage,
      authorizedAt: resultado.status === 'AUTORIZADO' ? new Date() : atual.authorizedAt,
      capturedAt: capturado ? new Date() : atual.capturedAt,
      failedAt: resultado.status === 'RECUSADO' ? new Date() : atual.failedAt,
      expiresAt: resultado.pixExpiresAt ?? resultado.boletoDueDate ?? atual.expiresAt,
    },
  });

  if (capturado) {
    const novoStatus: OrderStatus =
      atual.order.paidCents + resultado.capturedCents >= atual.order.totalCents ? 'PAGO' : 'PARCIALMENTE_PAGO';

    await prisma.$transaction([
      prisma.order.update({
        where: { id: atual.orderId },
        data: {
          status: novoStatus,
          paidCents: { increment: resultado.capturedCents },
          paidAt: novoStatus === 'PAGO' ? new Date() : undefined,
        },
      }),
      prisma.registration.updateMany({
        where: { orderId: atual.orderId, status: 'AGUARDANDO_PAGAMENTO' },
        data: { status: 'CONFIRMADA' },
      }),
      prisma.ledgerEntry.create({
        data: {
          orderId: atual.orderId,
          paymentId,
          account: 'receita.eventos',
          direction: 'CREDITO',
          amountCents: resultado.capturedCents,
          description: `Recebimento do pedido ${atual.order.code}`,
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          orderId: atual.orderId,
          paymentId,
          account: 'taxa.gateway',
          direction: 'DEBITO',
          amountCents: resultado.providerFeeCents,
          description: `Taxa do provedor (${payment.provider})`,
        },
      }),
    ]);

    publish('pagamento', { orderCode: atual.order.code, status: 'PAGO', totalCents: atual.order.totalCents });
    await recalcularContadores(['inscricoes_confirmadas']);
  }

  return payment;
}
