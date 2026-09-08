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

const API = 'https://api.stripe.com/v1';

function mapStatus(status: string): PaymentStatus {
  switch (status) {
    case 'succeeded':
      return 'CAPTURADO';
    case 'requires_capture':
      return 'AUTORIZADO';
    case 'processing':
      return 'EM_ANALISE';
    case 'requires_payment_method':
    case 'requires_action':
    case 'requires_confirmation':
      return 'PENDENTE';
    case 'canceled':
      return 'CANCELADO';
    default:
      return 'PENDENTE';
  }
}

/** Serializa objeto aninhado no formato `application/x-www-form-urlencoded` da Stripe. */
function encodeForm(obj: Record<string, unknown>, prefix = ''): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .flatMap(([k, v]) => {
      const key = prefix ? `${prefix}[${k}]` : k;
      if (typeof v === 'object' && !Array.isArray(v)) return encodeForm(v as Record<string, unknown>, key);
      if (Array.isArray(v)) return v.map((item, i) => `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`;
    })
    .join('&');
}

/** Gateway internacional — usado nas campanhas de missões fora do Brasil. */
export class StripeGateway implements PaymentGateway {
  readonly provider = 'STRIPE' as const;
  readonly supports = ['CARTAO_CREDITO', 'CARTAO_DEBITO'] as const satisfies readonly ('CARTAO_CREDITO' | 'CARTAO_DEBITO')[];

  constructor(private readonly secretKey = env.STRIPE_SECRET_KEY) {
    if (!secretKey) throw new GatewayError('Stripe sem secret key.', 'CONFIG_AUSENTE');
  }

  private async request<T>(path: string, body?: Record<string, unknown>, idempotencyKey?: string) {
    const res = await fetch(`${API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: body ? encodeForm(body) : undefined,
      cache: 'no-store',
    });
    const json = (await res.json()) as T & { error?: { message: string; code?: string } };
    if (!res.ok) {
      throw new GatewayError(json.error?.message ?? `Stripe ${res.status}`, json.error?.code ?? 'ERRO_GATEWAY', res.status, json);
    }
    return json;
  }

  async charge(input: ChargeRequest): Promise<ChargeResult> {
    const data = await this.request<StripeIntent>(
      '/payment_intents',
      {
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        description: input.description,
        confirm: true,
        payment_method: input.cardToken,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        receipt_email: input.payer.email,
        metadata: { orderCode: input.orderCode, ...(input.metadata as Record<string, string>) },
      },
      input.idempotencyKey,
    );
    return this.toResult(data);
  }

  async fetchPayment(id: string): Promise<ChargeResult | null> {
    try {
      return this.toResult(await this.request<StripeIntent>(`/payment_intents/${id}`));
    } catch (error) {
      if (error instanceof GatewayError && error.httpStatus === 404) return null;
      throw error;
    }
  }

  async refund(input: RefundRequest): Promise<RefundResult> {
    const data = await this.request<{ id: string; status: string }>(
      '/refunds',
      { payment_intent: input.providerPaymentId, amount: input.amountCents, reason: 'requested_by_customer' },
      input.idempotencyKey,
    );
    return { providerRefundId: data.id, status: data.status === 'succeeded' ? 'CONCLUIDO' : 'PROCESSANDO', raw: data };
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification {
    const secret = env.STRIPE_WEBHOOK_SECRET;
    let payload: { id?: string; type?: string; data?: { object?: { id?: string } } } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, externalId: 'invalido', eventType: 'desconhecido', reason: 'JSON inválido' };
    }
    const externalId = payload.id ?? `stripe:${Date.now()}`;
    const eventType = payload.type ?? 'desconhecido';
    const providerPaymentId = payload.data?.object?.id;

    if (!secret) return { valid: false, externalId, eventType, providerPaymentId, reason: 'Segredo não configurado' };

    const sig = headers['stripe-signature'] ?? '';
    const parts = Object.fromEntries(sig.split(',').map((p) => p.split('=') as [string, string]));
    const ts = parts.t;
    const v1 = parts.v1;
    if (!ts || !v1) return { valid: false, externalId, eventType, providerPaymentId, reason: 'Assinatura ausente' };

    const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    if (valid && Math.abs(Date.now() / 1000 - Number(ts)) > 300) {
      return { valid: false, externalId, eventType, providerPaymentId, reason: 'Assinatura expirada' };
    }
    return { valid, externalId, eventType, providerPaymentId, reason: valid ? undefined : 'HMAC divergente' };
  }

  private toResult(data: StripeIntent): ChargeResult {
    const card = data.charges?.data?.[0]?.payment_method_details?.card;
    const status = mapStatus(data.status ?? 'processing');
    return {
      provider: this.provider,
      providerPaymentId: data.id,
      status,
      providerStatusRaw: data.status ?? '',
      amountCents: data.amount ?? 0,
      capturedCents: data.amount_received ?? 0,
      providerFeeCents: 0,
      cardBrand: card?.brand,
      cardLast4: card?.last4,
      redirectUrl: data.next_action?.redirect_to_url?.url,
      raw: data,
    };
  }
}

type StripeIntent = {
  id: string;
  status?: string;
  amount?: number;
  amount_received?: number;
  next_action?: { redirect_to_url?: { url?: string } };
  charges?: { data?: { payment_method_details?: { card?: { brand?: string; last4?: string } } }[] };
};
