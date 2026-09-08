import { z } from 'zod';
import { prisma } from '@/lib/db';
import { erro, ok, tratarErro } from '@/lib/api';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { recalcularContadores } from '@/lib/stats';
import { publish } from '@/lib/realtime/bus';

export const dynamic = 'force-dynamic';

const schema = z.object({
  casoId: z.string().min(1),
  aprovar: z.boolean(),
  nota: z.string().max(400).optional(),
});

/** Decisão humana sobre um item da fila de moderação. */
export async function POST(req: Request) {
  try {
    const revisor = await requirePermission(PERMISSIONS.MURAL_MODERAR);
    const dados = schema.parse(await req.json());

    const caso = await prisma.moderationCase.findUnique({ where: { id: dados.casoId } });
    if (!caso) return erro('Caso não encontrado.', 404);
    if (caso.status !== 'ABERTO' && caso.status !== 'ESCALADO') {
      return erro('Este caso já foi decidido.', 409);
    }

    await prisma.moderationCase.update({
      where: { id: caso.id },
      data: {
        status: dados.aprovar ? 'APROVADO' : 'REPROVADO',
        reviewerId: revisor.id,
        decisionNote: dados.nota,
        decidedAt: new Date(),
      },
    });

    if (caso.entityType === 'prayer_request' && caso.prayerRequestId) {
      await prisma.prayerRequest.update({
        where: { id: caso.prayerRequestId },
        data: dados.aprovar
          ? { status: 'PUBLICADO', publishedAt: new Date(), autoFlagged: false }
          : { status: 'ARQUIVADO' },
      });
      if (dados.aprovar) {
        publish('mural', { tipo: 'novo_pedido', id: caso.prayerRequestId });
        await recalcularContadores(['pedidos_de_oracao']);
      }
    }

    if (caso.entityType === 'media_submission') {
      await prisma.mediaSubmission.update({
        where: { id: caso.entityId },
        data: {
          status: dados.aprovar ? 'PUBLICADO' : 'REPROVADO',
          reviewerId: revisor.id,
          reviewedAt: new Date(),
          reviewNote: dados.nota,
          publishedAt: dados.aprovar ? new Date() : null,
        },
      });
      if (dados.aprovar) {
        await prisma.mediaAsset.updateMany({
          where: { submissionId: caso.entityId, status: { in: ['PROCESSANDO', 'VALIDADO'] } },
          data: { status: 'PUBLICADO' },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: revisor.id,
        action: dados.aprovar ? 'moderation.approved' : 'moderation.rejected',
        entityType: caso.entityType,
        entityId: caso.entityId,
      },
    });

    return ok({ aprovado: dados.aprovar });
  } catch (e) {
    return tratarErro(e);
  }
}
