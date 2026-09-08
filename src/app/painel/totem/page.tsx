import type { Metadata } from 'next';
import { prisma, safeQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { Totem } from '@/components/painel/Totem';

export const metadata: Metadata = { title: 'Totem de presença', robots: { index: false } };
export const dynamic = 'force-dynamic';

/**
 * Tela do totem — pensada para ficar aberta numa TV ou tablet na entrada.
 * O QR se renova a cada 60 s sem recarregar a página.
 */
export default async function TotemPage() {
  await requirePermission(PERMISSIONS.PRESENCA_REGISTRAR);

  const agora = new Date();
  const culto = await safeQuery(
    () =>
      prisma.serviceOccurrence.findFirst({
        where: {
          canceled: false,
          startsAt: { gte: new Date(agora.getTime() - 3 * 3_600_000), lte: new Date(agora.getTime() + 6 * 3_600_000) },
        },
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true, startsAt: true, attendanceCount: true },
      }),
    null,
  );

  return (
    <Totem
      culto={
        culto
          ? {
              id: culto.id,
              titulo: culto.title,
              inicio: culto.startsAt.toISOString(),
              presentes: culto.attendanceCount,
            }
          : null
      }
    />
  );
}
