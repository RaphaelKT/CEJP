import { erro, ipHashDe, limitar, ok, respostaLimite, tratarErro } from '@/lib/api';
import { checkoutSchema } from '@/lib/validation';
import { processarCheckout } from '@/lib/payments/service';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Finalização de compra.
 *
 * O corpo traz apenas identificadores e quantidades — nunca preços.
 * Todo o valor é recalculado no servidor a partir do lote no banco, o que
 * torna irrelevante qualquer adulteração no cliente.
 */
export async function POST(req: Request) {
  try {
    const limite = limitar(`checkout:${ipHashDe(req)}`, 10, 600_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const dados = checkoutSchema.parse(await req.json());
    const usuario = await getSessionUser().catch(() => null);

    const resultado = await processarCheckout({
      editionSlug: dados.editionSlug,
      tierId: dados.tierId,
      quantity: dados.quantity,
      buyer: dados.buyer,
      participants: dados.participants,
      method: dados.method,
      installments: dados.installments,
      couponCode: dados.couponCode,
      cardToken: dados.card?.token,
      idempotencyKey: dados.idempotencyKey,
      userId: usuario?.id ?? null,
    });

    await prisma.auditLog.create({
      data: {
        actorId: usuario?.id,
        action: 'order.created',
        entityType: 'order',
        entityId: resultado.orderCode,
        after: { status: resultado.status, totalCents: resultado.totalCents },
        ipHash: ipHashDe(req),
      },
    }).catch(() => null);

    if (resultado.status === 'RECUSADO') {
      return erro(resultado.failureMessage ?? 'Pagamento não autorizado.', 402, { resultado });
    }

    return ok({ resultado }, 201);
  } catch (e) {
    return tratarErro(e);
  }
}
