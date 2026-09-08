import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentStatus } from '@prisma/client';
import { env } from '@/lib/env';
import {
  GatewayError,
  type ChargeRequest,
  type ChargeResult,
  type PaymentGateway,
  type RefundRequest,
  type RefundResult,
  type WebhookVerification,
} from './types';

const API = 'https://api.mercadopago.com';

/** Mapeia o status do Mercado Pago para o nosso vocabulário interno. */
function mapStatus(status: string, detail?: string): PaymentStatus {
  switch (status) {
    case 'approved':
      return 'CAPTURADO';
    case 'authorized':
      return 'AUTORIZADO';
    case 'in_process':
    case 'in_mediation':
      return 'EM_ANALISE';
    case 'pending':
      return 'PENDENTE';
    case 'rejected':
      return detail === 'cc_rejected_high_risk' ? 'RECUSADO' : 'RECUSADO';
    case 'cancelled':
      return 'CANCELADO';
    case 'refunded':
      return 'ESTORNADO_TOTAL';
    case 'charged_back':
      return 'CHARGEBACK';
    default:
      return 'PENDENTE';
  }
}

const METHOD_MAP: Record<string, string> = {
  PIX: 'pix',
  BOLETO: 'bolbradesco',
};

export class MercadoPagoGateway implements PaymentGateway {
  readonly provider = 'MERCADO_PAGO' as const;
  readonly supports = ['PIX', 'CARTAO_CREDITO', 'BOLETO'] as const satisfies readonly ('PIX' | 'CARTAO_CREDITO' | 'BOLETO')[];

  constructor(private readonly accessToken = env.MERCADO_PAGO_ACCESS_TOKEN) {
    if (!accessToken) throw new GatewayError('Mercado Pago sem access token.', 'CONFIG_AUSENTE');
  }

  private async request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
    const { idempotencyKey, ...rest } = init;
    const res = await fetch(`${API}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
        ...(rest.headers as Record<string, string>),
      },
      cache: 'no-store',
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as T & { message?: string; error?: string }) : ({} as T);
    if (!res.ok) {
      throw new GatewayError(
        (json as { message?: string }).message ?? `Mercado Pago retornou ${res.status}`,
        (json as { error?: string }).error ?? 'ERRO_GATEWAY',
        res.status,
        json,
      );
    }
    return json;
  }

  async charge(input: ChargeRequest): Promise<ChargeResult> {
    const [firstName, ...rest] = input.payer.name.split(' ');
    const body: Record<string, unknown> = {
      transaction_amount: Number((input.amountCents / 100).toFixed(2)),
      description: input.description,
      external_reference: input.orderCode,
      notification_url: input.notificationUrl,
      statement_descriptor: 'MEB IGREJA',
      metadata: input.metadata,
      payer: {
        email: input.payer.email,
        first_name: firstName,
        last_name: rest.join(' ') || firstName,
        ...(input.payer.document
          ? {
              identification: {
                type: input.payer.documentType ?? (input.payer.document.length === 14 ? 'CNPJ' : 'CPF'),
                number: input.payer.document,
              },
            }
          : {}),
      },
    };

    if (input.method === 'CARTAO_CREDITO') {
      if (!input.cardToken) throw new GatewayError('Token do cartão ausente.', 'TOKEN_AUSENTE');
      body.token = input.cardToken;
      body.installments = input.installments;
      body.capture = true;
    } else {
      body.payment_method_id = METHOD_MAP[input.method] ?? 'pix';
      if (input.method === 'PIX') {
        body.date_of_expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      }
    }

    const data = await this.request<MpPayment>('/v1/payments', {
      method: 'POST',
      body: JSON.stringify(body),
      idempotencyKey: input.idempotencyKey,
    });

    return this.toResult(data, input.amountCents);
  }

  async fetchPayment(providerPaymentId: string): Promise<ChargeResult | null> {
    try {
      const data = await this.request<MpPayment>(`/v1/payments/${providerPaymentId}`);
      return this.toResult(data, Math.round((data.transaction_amount ?? 0) * 100));
    } catch (error) {
      if (error instanceof GatewayError && error.httpStatus === 404) return null;
      throw error;
    }
  }

  async refund(input: RefundRequest): Promise<RefundResult> {
    const data = await this.request<{ id: number; status: string }>(
      `/v1/payments/${input.providerPaymentId}/refunds`,
      {
        method: 'POST',
        body: JSON.stringify({ amount: Number((input.amountCents / 100).toFixed(2)) }),
        idempotencyKey: input.idempotencyKey,
      },
    );
    return {
      providerRefundId: String(data.id),
      status: data.status === 'approved' ? 'CONCLUIDO' : 'PROCESSANDO',
      raw: data,
    };
  }

  /**
   * Validação da assinatura HMAC do webhook (header `x-signature`).
   * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
   */
  verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification {
    const secret = env.MERCADO_PAGO_WEBHOOK_SECRET;
    let payload: { id?: string; type?: string; action?: string; data?: { id?: string } } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, externalId: 'invalido', eventType: 'desconhecido', reason: 'JSON inválido' };
    }

    const dataId = payload.data?.id ?? '';
    const eventType = payload.action ?? payload.type ?? 'desconhecido';
    const externalId = `${eventType}:${dataId || payload.id || Date.now()}`;

    if (!secret) {
      return { valid: false, externalId, eventType, providerPaymentId: dataId, reason: 'Segredo do webhook não configurado' };
    }

    const signature = headers['x-signature'] ?? '';
    const requestId = headers['x-request-id'] ?? '';
    const parts = Object.fromEntries(
      signature.split(',').map((p) => p.split('=').map((s) => s.trim()) as [string, string]),
    );
    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return { valid: false, externalId, eventType, providerPaymentId: dataId, reason: 'Assinatura ausente' };

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    const valid = a.length === b.length && timingSafeEqual(a, b);

    // Janela antirreplay de 5 minutos.
    const idade = Math.abs(Date.now() - Number(ts));
    if (valid && idade > 300_000) {
      return { valid: false, externalId, eventType, providerPaymentId: dataId, reason: 'Assinatura expirada' };
    }

    return { valid, externalId, eventType, providerPaymentId: dataId, reason: valid ? undefined : 'HMAC divergente' };
  }

  private toResult(data: MpPayment, fallbackAmount: number): ChargeResult {
    const tx = data.point_of_interaction?.transaction_data;
    const centavos = Math.round((data.transaction_amount ?? fallbackAmount / 100) * 100);
    const taxa = Math.round(
      (data.fee_details?.reduce((acc, f) => acc + (f.amount ?? 0), 0) ?? 0) * 100,
    );
    const status = mapStatus(data.status ?? 'pending', data.status_detail);
    return {
      provider: this.provider,
      providerPaymentId: String(data.id),
      status,
      providerStatusRaw: `${data.status}/${data.status_detail ?? ''}`,
      amountCents: centavos,
      capturedCents: status === 'CAPTURADO' ? centavos : 0,
      providerFeeCents: taxa,
      pixQrCode: tx?.qr_code,
      pixQrCodeBase64: tx?.qr_code_base64,
      pixExpiresAt: data.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
      boletoUrl: data.transaction_details?.external_resource_url,
      boletoBarcode: data.barcode?.content,
      cardBrand: data.payment_method_id,
      cardLast4: data.card?.last_four_digits,
      authorizationCode: data.authorization_code,
      failureCode: status === 'RECUSADO' ? data.status_detail : undefined,
      failureMessage: status === 'RECUSADO' ? traduzRecusa(data.status_detail) : undefined,
      raw: data,
    };
  }
}

/** Mensagens acionáveis em português para o comprador. */
export function traduzRecusa(detail?: string): string {
  const mapa: Record<string, string> = {
    cc_rejected_insufficient_amount: 'Cartão sem limite disponível. Tente outro cartão ou PIX.',
    cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) incorreto.',
    cc_rejected_bad_filled_date: 'Data de validade incorreta.',
    cc_rejected_bad_filled_other: 'Confira os dados do cartão e tente novamente.',
    cc_rejected_call_for_authorize: 'Autorize a compra com o seu banco e tente de novo.',
    cc_rejected_card_disabled: 'Cartão desativado. Fale com o seu banco.',
    cc_rejected_high_risk: 'Pagamento não autorizado por segurança. Tente PIX ou outro cartão.',
    cc_rejected_max_attempts: 'Muitas tentativas. Aguarde alguns minutos.',
    cc_rejected_duplicated_payment: 'Já existe um pagamento igual em andamento.',
  };
  return mapa[detail ?? ''] ?? 'Pagamento não autorizado. Tente outra forma de pagamento.';
}

type MpPayment = {
  id: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  date_of_expiration?: string;
  authorization_code?: string;
  payment_method_id?: string;
  fee_details?: { amount?: number }[];
  card?: { last_four_digits?: string };
  barcode?: { content?: string };
  transaction_details?: { external_resource_url?: string };
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
};
