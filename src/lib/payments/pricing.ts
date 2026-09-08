import type { PaymentMethod } from '@prisma/client';

/**
 * Motor de precificação.
 *
 * Todo cálculo é feito em centavos (inteiros) — nunca float — e a soma das
 * parcelas é reconciliada com o total para que nenhum centavo se perca no
 * arredondamento.
 */

export type FeePolicy = {
  /** Taxa do gateway em basis points (250 = 2,50%). */
  bps: number;
  /** Taxa fixa por transação, em centavos. */
  fixedCents: number;
  /** Juros ao mês, em basis points, para parcelamento sem "sem juros". */
  monthlyInterestBps: number;
  /** Parcelas iniciais sem juros bancadas pela igreja. */
  interestFreeInstallments: number;
};

export const FEE_POLICIES: Record<PaymentMethod, FeePolicy> = {
  PIX: { bps: 99, fixedCents: 0, monthlyInterestBps: 0, interestFreeInstallments: 1 },
  CARTAO_CREDITO: { bps: 399, fixedCents: 39, monthlyInterestBps: 199, interestFreeInstallments: 3 },
  CARTAO_DEBITO: { bps: 189, fixedCents: 39, monthlyInterestBps: 0, interestFreeInstallments: 1 },
  BOLETO: { bps: 0, fixedCents: 349, monthlyInterestBps: 0, interestFreeInstallments: 1 },
  DINHEIRO: { bps: 0, fixedCents: 0, monthlyInterestBps: 0, interestFreeInstallments: 1 },
  TRANSFERENCIA: { bps: 0, fixedCents: 0, monthlyInterestBps: 0, interestFreeInstallments: 1 },
  CORTESIA: { bps: 0, fixedCents: 0, monthlyInterestBps: 0, interestFreeInstallments: 1 },
};

/** Desconto à vista no PIX (incentivo de caixa). */
export const PIX_DISCOUNT_BPS = 500; // 5%

export type CouponLike = {
  percentOff: number | null;
  amountOffCents: number | null;
  minOrderCents: number;
};

export type Quote = {
  subtotalCents: number;
  couponDiscountCents: number;
  methodDiscountCents: number;
  discountCents: number;
  interestCents: number;
  totalCents: number;
  installments: number;
  installmentCents: number;
  /** Parcelas exatas — a última absorve o resto da divisão. */
  installmentPlan: { number: number; cents: number }[];
  gatewayFeeCents: number;
  netCents: number;
  interestFree: boolean;
};

export function applyCoupon(subtotalCents: number, coupon?: CouponLike | null): number {
  if (!coupon) return 0;
  if (subtotalCents < coupon.minOrderCents) return 0;
  if (coupon.percentOff) return Math.round((subtotalCents * coupon.percentOff) / 100);
  if (coupon.amountOffCents) return Math.min(coupon.amountOffCents, subtotalCents);
  return 0;
}

/**
 * Tabela Price: juros compostos sobre o saldo, retornando o total com juros.
 * Se as parcelas estiverem dentro da faixa sem juros, retorna o próprio valor.
 */
export function withInterest(baseCents: number, installments: number, policy: FeePolicy) {
  if (installments <= policy.interestFreeInstallments || policy.monthlyInterestBps === 0) {
    return { totalCents: baseCents, interestCents: 0, interestFree: true };
  }
  const i = policy.monthlyInterestBps / 10_000;
  const n = installments;
  const coef = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const parcela = Math.ceil(baseCents * coef);
  const total = parcela * n;
  return { totalCents: total, interestCents: total - baseCents, interestFree: false };
}

export function splitInstallments(totalCents: number, installments: number) {
  const base = Math.floor(totalCents / installments);
  const resto = totalCents - base * installments;
  return Array.from({ length: installments }, (_, idx) => ({
    number: idx + 1,
    // distribui o resto nas primeiras parcelas — soma sempre bate com o total
    cents: base + (idx < resto ? 1 : 0),
  }));
}

export function quote(params: {
  subtotalCents: number;
  method: PaymentMethod;
  installments?: number;
  coupon?: CouponLike | null;
}): Quote {
  const { subtotalCents, method } = params;
  const policy = FEE_POLICIES[method];
  const installments = method === 'CARTAO_CREDITO' ? Math.max(1, params.installments ?? 1) : 1;

  const couponDiscountCents = applyCoupon(subtotalCents, params.coupon);
  const afterCoupon = subtotalCents - couponDiscountCents;

  const methodDiscountCents =
    method === 'PIX' ? Math.round((afterCoupon * PIX_DISCOUNT_BPS) / 10_000) : 0;
  const base = afterCoupon - methodDiscountCents;

  const { totalCents, interestCents, interestFree } = withInterest(base, installments, policy);
  const plan = splitInstallments(totalCents, installments);

  const gatewayFeeCents = Math.round((totalCents * policy.bps) / 10_000) + policy.fixedCents;

  return {
    subtotalCents,
    couponDiscountCents,
    methodDiscountCents,
    discountCents: couponDiscountCents + methodDiscountCents,
    interestCents,
    totalCents,
    installments,
    installmentCents: plan[0]?.cents ?? totalCents,
    installmentPlan: plan,
    gatewayFeeCents,
    netCents: totalCents - gatewayFeeCents,
    interestFree,
  };
}

/** Simulação exibida no checkout ("em até 6x de R$ ..."). */
export function installmentOptions(subtotalCents: number, max: number, coupon?: CouponLike | null) {
  return Array.from({ length: max }, (_, idx) => {
    const q = quote({ subtotalCents, method: 'CARTAO_CREDITO', installments: idx + 1, coupon });
    return {
      installments: idx + 1,
      installmentCents: q.installmentCents,
      totalCents: q.totalCents,
      interestFree: q.interestFree,
    };
  });
}

/**
 * Política de reembolso padrão (pode ser sobrescrita por edição).
 * Retorna o percentual devolvido conforme a antecedência do cancelamento.
 */
export function refundPercent(daysBeforeEvent: number, policy?: { days: number; percent: number }[]) {
  const table = policy ?? [
    { days: 45, percent: 100 },
    { days: 30, percent: 80 },
    { days: 15, percent: 50 },
    { days: 7, percent: 30 },
    { days: 0, percent: 0 },
  ];
  const ordenada = [...table].sort((a, b) => b.days - a.days);
  for (const faixa of ordenada) {
    if (daysBeforeEvent >= faixa.days) return faixa.percent;
  }
  return 0;
}
