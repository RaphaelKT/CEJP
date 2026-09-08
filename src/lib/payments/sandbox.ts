import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import type {
  ChargeRequest,
  ChargeResult,
  PaymentGateway,
  RefundRequest,
  RefundResult,
  WebhookVerification,
} from './types';

/**
 * Gateway de demonstração/homologação.
 *
 * Reproduz fielmente a máquina de estados real (PIX pendente → capturado,
 * cartão aprovado/recusado por regra determinística, boleto com vencimento),
 * permitindo demonstrar e testar todo o fluxo financeiro sem credenciais.
 *
 * Regras determinísticas para QA:
 *  - cartão cujo token termina em "0000" → recusado por saldo
 *  - cartão cujo token termina em "0001" → em análise
 *  - demais → aprovado
 */
export class SandboxGateway implements PaymentGateway {
  readonly provider = 'SANDBOX' as const;
  readonly supports = ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO'] as const satisfies readonly (
    | 'PIX'
    | 'CARTAO_CREDITO'
    | 'CARTAO_DEBITO'
    | 'BOLETO'
  )[];

  async charge(input: ChargeRequest): Promise<ChargeResult> {
    const id = `sbx_${randomUUID()}`;
    const feeCents = Math.round(input.amountCents * 0.0099);

    if (input.method === 'PIX') {
      const payload = montarPixCopiaECola(input);
      return {
        provider: this.provider,
        providerPaymentId: id,
        status: 'PENDENTE',
        providerStatusRaw: 'pending_waiting_transfer',
        amountCents: input.amountCents,
        capturedCents: 0,
        providerFeeCents: feeCents,
        pixQrCode: payload,
        pixQrCodeBase64: undefined,
        pixExpiresAt: new Date(Date.now() + 30 * 60_000),
      };
    }

    if (input.method === 'BOLETO') {
      const venc = new Date(Date.now() + 3 * 86_400_000);
      return {
        provider: this.provider,
        providerPaymentId: id,
        status: 'PENDENTE',
        providerStatusRaw: 'pending_waiting_payment',
        amountCents: input.amountCents,
        capturedCents: 0,
        providerFeeCents: 349,
        boletoUrl: `${env.APP_URL}/api/pagamentos/boleto/${id}`,
        boletoBarcode: gerarLinhaDigitavel(input.amountCents, venc),
        boletoDueDate: venc,
      };
    }

    const token = input.cardToken ?? '';
    if (token.endsWith('0000')) {
      return {
        provider: this.provider,
        providerPaymentId: id,
        status: 'RECUSADO',
        providerStatusRaw: 'cc_rejected_insufficient_amount',
        amountCents: input.amountCents,
        capturedCents: 0,
        providerFeeCents: 0,
        failureCode: 'cc_rejected_insufficient_amount',
        failureMessage: 'Cartão sem limite disponível. Tente outro cartão ou PIX.',
      };
    }
    if (token.endsWith('0001')) {
      return {
        provider: this.provider,
        providerPaymentId: id,
        status: 'EM_ANALISE',
        providerStatusRaw: 'in_process',
        amountCents: input.amountCents,
        capturedCents: 0,
        providerFeeCents: feeCents,
      };
    }

    return {
      provider: this.provider,
      providerPaymentId: id,
      status: 'CAPTURADO',
      providerStatusRaw: 'approved',
      amountCents: input.amountCents,
      capturedCents: input.amountCents,
      providerFeeCents: Math.round(input.amountCents * 0.0399) + 39,
      cardBrand: 'visa',
      cardLast4: token.slice(-4) || '4242',
      authorizationCode: randomUUID().slice(0, 6).toUpperCase(),
    };
  }

  async fetchPayment(): Promise<ChargeResult | null> {
    return null;
  }

  async refund(input: RefundRequest): Promise<RefundResult> {
    return { providerRefundId: `sbxref_${randomUUID()}`, status: 'CONCLUIDO' };
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification {
    let payload: { id?: string; type?: string; paymentId?: string } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, externalId: 'invalido', eventType: 'desconhecido', reason: 'JSON inválido' };
    }
    const expected = createHmac('sha256', env.CRON_SECRET).update(rawBody).digest('hex');
    const recebida = headers['x-sandbox-signature'] ?? '';
    const a = Buffer.from(expected);
    const b = Buffer.from(recebida);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return {
      valid,
      externalId: payload.id ?? `sbx:${Date.now()}`,
      eventType: payload.type ?? 'payment.updated',
      providerPaymentId: payload.paymentId,
      reason: valid ? undefined : 'HMAC divergente',
    };
  }
}

/** Monta um BR Code PIX (EMV) plausível para exibição do "copia e cola". */
function montarPixCopiaECola(input: ChargeRequest) {
  const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, '0')}${valor}`;
  const merchant =
    campo('00', 'br.gov.bcb.pix') + campo('01', 'contato@missaoevangelicadobrasil.org.br');
  const payload =
    campo('00', '01') +
    campo('26', merchant) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', (input.amountCents / 100).toFixed(2)) +
    campo('58', 'BR') +
    campo('59', 'MISSAO EVANGELICA BR') +
    campo('60', 'RIO DE JANEIRO') +
    campo('62', campo('05', input.orderCode.replace(/[^A-Z0-9]/gi, '').slice(0, 25)));
  return `${payload}6304${crc16(`${payload}6304`)}`;
}

function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function gerarLinhaDigitavel(cents: number, vencimento: Date) {
  const fator = Math.floor((vencimento.getTime() - Date.UTC(1997, 9, 7)) / 86_400_000);
  const valor = String(cents).padStart(10, '0');
  const base = `23793381286${fator}${valor}`;
  return base.replace(/(.{5})(.{5})(.{5})(.{6})(.{5})(.{6})(.*)/, '$1.$2 $3.$4 $5.$6 $7');
}
