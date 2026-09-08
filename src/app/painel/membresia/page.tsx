import type { Metadata } from 'next';
import { prisma, safeQuery } from '@/lib/db';
import { MembresiaPainel } from '@/components/painel/MembresiaPainel';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';

export const metadata: Metadata = { title: 'Membresia', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PainelMembresiaPage() {
  await requirePermission(PERMISSIONS.MEMBRESIA_APROVAR);

  const regra = await safeQuery(
    () => prisma.membershipRule.findUnique({ where: { key: 'default' } }),
    null,
  );
  const minimo = regra?.minAttendance ?? 5;
  const janela = regra?.windowDays ?? 30;
  const desde = new Date(Date.now() - janela * 86_400_000);

  const [pendentes, frequentadores] = await Promise.all([
    safeQuery(
      () =>
        prisma.user.findMany({
          where: { membershipStage: 'EM_AVALIACAO' },
          select: {
            id: true, publicId: true, fullName: true, email: true, createdAt: true,
            _count: { select: { checkIns: { where: { status: 'CONFIRMADO', checkedInAt: { gte: desde } } } } },
          },
          orderBy: { updatedAt: 'asc' },
          take: 50,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.user.findMany({
          where: { membershipStage: 'FREQUENTADOR' },
          select: {
            id: true, publicId: true, fullName: true, email: true, createdAt: true,
            _count: { select: { checkIns: { where: { status: 'CONFIRMADO', checkedInAt: { gte: desde } } } } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 30,
        }),
      [],
    ),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">Secretaria</p>
        <h1 className="font-display text-3xl text-ink-900">Membresia</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          O sistema promove automaticamente quem registra <strong>{minimo} presenças confirmadas</strong>{' '}
          em <strong>{janela} dias</strong>. A confirmação pastoral abaixo é o último passo antes de a
          pessoa contar como membro oficial no site.
        </p>
      </header>

      <MembresiaPainel
        minimo={minimo}
        janela={janela}
        pendentes={pendentes.map((u) => ({
          id: u.id, publicId: u.publicId, nome: u.fullName, email: u.email,
          presencas: u._count.checkIns, desde: u.createdAt.toISOString(),
        }))}
        frequentadores={frequentadores.map((u) => ({
          id: u.id, publicId: u.publicId, nome: u.fullName, email: u.email,
          presencas: u._count.checkIns, desde: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
