import type { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';

export type Money = { cents: number; currency: 'BRL' | 'USD' };

export type ChargeRequest = {
  orderCode: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  installments: number;
  description: string;
  idempotencyKey: string;
  payer: {
    name: string;
    email: string;
    phone?: string;
    document?: string; // apenas dígitos
    documentType?: 'CPF' | 'CNPJ';
  };
  /** Token do cartão gerado no navegador (PCI SAQ-A: o servidor nunca vê o PAN). */
  cardToken?: string;
  notificationUrl?: string;
  metadata?: Record<string, unknown>;
};

export type ChargeResult = {
  provider: PaymentProvider;
  providerPaymentId: string;
  status: PaymentStatus;
  providerStatusRaw: string;
  amountCents: number;
  capturedCents: number;
  providerFeeCents: number;
  /** PIX */
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixExpiresAt?: Date;
  /** Boleto */
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoDueDate?: Date;
  /** Cartão */
  cardBrand?: string;
  cardLast4?: string;
  authorizationCode?: string;
  /** Redirecionamento (checkout hospedado) */
  redirectUrl?: string;
  failureCode?: string;
  failureMessage?: string;
  raw?: unknown;
};

export type RefundRequest = {
  providerPaymentId: string;
  amountCents: number;
  reason: string;
  idempotencyKey: string;
};

export type RefundResult = {
  providerRefundId: string;
  status: 'CONCLUIDO' | 'PROCESSANDO' | 'RECUSADO';
  raw?: unknown;
};

export type WebhookVerification = {
  valid: boolean;
  externalId: string;
  eventType: string;
  /** ID do pagamento no provedor, quando identificável. */
  providerPaymentId?: string;
  reason?: string;
};

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  readonly supports: readonly PaymentMethod[];
  charge(input: ChargeRequest): Promise<ChargeResult>;
  fetchPayment(providerPaymentId: string): Promise<ChargeResult | null>;
  refund(input: RefundRequest): Promise<RefundResult>;
  verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification;
}

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus?: number,
    readonly raw?: unknown,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}
