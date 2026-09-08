import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { erro, tratarErro } from '@/lib/api';
import { installmentOptions, quote } from '@/lib/payments/pricing';

export const dynamic = 'force-dynamic';

const schema = z.object({
  tierId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
  method: z.enum(['PIX', 'CARTAO_CREDITO', 'BOLETO']),
  installments: z.coerce.number().int().min(1).max(12).default(1),
  couponCode: z.string().trim().toUpperCase().optional(),
});

/** Simulação de preço em tempo real no checkout (sem criar pedido). */
export async function POST(req: Request) {
  try {
    const dados = schema.parse(await req.json());

    const tier = await prisma.ticketTier.findUnique({
      where: { id: dados.tierId },
      include: { edition: { select: { installmentsMax: true } } },
    });
    if (!tier) return erro('Lote não encontrado.', 404);

    const cupom = dados.couponCode
      ? await prisma.coupon.findFirst({
          where: { code: dados.couponCode, active: true, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        })
      : null;

    if (dados.couponCode && !cupom) {
      return erro('Cupom inválido ou expirado.', 422, { campos: { couponCode: 'Cupom inválido.' } });
    }

    const subtotal = tier.priceCents * dados.quantity;
    const cotacao = quote({ subtotalCents: subtotal, method: dados.method, installments: dados.installments, coupon: cupom });
    const parcelas = installmentOptions(subtotal, tier.edition.installmentsMax, cupom);

    return NextResponse.json({ ok: true, cotacao, parcelas, cupomAplicado: cupom?.code ?? null });
  } catch (e) {
    return tratarErro(e);
  }
}
