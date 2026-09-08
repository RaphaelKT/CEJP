import type { Metadata } from 'next';
import { prisma, safeQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { relativeTime } from '@/lib/utils/format';
import { ModeracaoLista } from '@/components/painel/ModeracaoLista';

export const metadata: Metadata = { title: 'Moderação', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PainelMuralPage() {
  await requirePermission(PERMISSIONS.MURAL_MODERAR);

  const casos = await safeQuery(
    () =>
      prisma.moderationCase.findMany({
        where: { status: { in: ['ABERTO', 'ESCALADO'] } },
        orderBy: [{ status: 'desc' }, { createdAt: 'asc' }],
        take: 50,
        include: { prayerRequest: { select: { publicId: true, body: true, category: true, urgent: true, createdAt: true } } },
      }),
    [],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">Cuidado pastoral</p>
        <h1 className="font-display text-3xl text-ink-900">Moderação do mural</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          A triagem automática já publicou o que é claramente seguro. Aqui ficam apenas os casos
          duvidosos e — em vermelho — os que sinalizam risco à vida e exigem contato imediato.
        </p>
      </header>

      <ModeracaoLista
        casos={casos.map((c) => ({
          id: c.id,
          motivo: c.reason,
          escalado: c.status === 'ESCALADO',
          criadoEm: relativeTime(c.createdAt),
          sinais: (c.signals as { motivos?: string[]; score?: number } | null) ?? null,
          pedido: c.prayerRequest
            ? {
                publicId: c.prayerRequest.publicId,
                texto: c.prayerRequest.body,
                categoria: c.prayerRequest.category,
                urgente: c.prayerRequest.urgent,
              }
            : null,
          entidade: c.entityType,
        }))}
      />
    </div>
  );
}
