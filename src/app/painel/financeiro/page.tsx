import type { Metadata } from 'next';
import { prisma, safeQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { formatBRL, formatDate, relativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Financeiro', robots: { index: false } };
export const dynamic = 'force-dynamic';

const CORES_STATUS: Record<string, string> = {
  CAPTURADO: 'bg-olive-500/15 text-olive-600',
  AUTORIZADO: 'bg-gold-100 text-gold-800',
  PENDENTE: 'bg-gold-100 text-gold-800',
  EM_ANALISE: 'bg-ink-100 text-ink-600',
  RECUSADO: 'bg-crimson-50 text-crimson-700',
  EXPIRADO: 'bg-ink-100 text-ink-400',
  ESTORNADO_TOTAL: 'bg-crimson-50 text-crimson-700',
  CHARGEBACK: 'bg-crimson-700 text-white',
};

export default async function PainelFinanceiroPage() {
  await requirePermission(PERMISSIONS.FINANCEIRO_LER);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [resumo, porMetodo, pagamentos, razao, webhooks] = await Promise.all([
    safeQuery(
      () =>
        prisma.payment.aggregate({
          where: { status: 'CAPTURADO', capturedAt: { gte: inicioMes } },
          _sum: { capturedCents: true, providerFeeCents: true, netCents: true },
          _count: true,
        }),
      { _sum: { capturedCents: 0, providerFeeCents: 0, netCents: 0 }, _count: 0 },
    ),
    safeQuery(
      () =>
        prisma.payment.groupBy({
          by: ['method'],
          where: { status: 'CAPTURADO', capturedAt: { gte: inicioMes } },
          _sum: { capturedCents: true },
          _count: true,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 25,
          include: { order: { select: { code: true, buyerName: true } } },
        }),
      [],
    ),
    safeQuery(
      () => prisma.ledgerEntry.groupBy({ by: ['account', 'direction'], _sum: { amountCents: true } }),
      [],
    ),
    safeQuery(
      () => prisma.webhookEvent.count({ where: { processedAt: null } }),
      0,
    ),
  ]);

  const bruto = resumo._sum.capturedCents ?? 0;
  const taxas = resumo._sum.providerFeeCents ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">Tesouraria</p>
        <h1 className="font-display text-3xl text-ink-900">Financeiro</h1>
        <p className="mt-2 text-[15px] text-ink-500">
          Competência de {formatDate(inicioMes, 'mes')} · conciliação automática a cada hora.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { rotulo: 'Recebido (bruto)', valor: formatBRL(bruto), tom: 'text-ink-900' },
          { rotulo: 'Taxas do gateway', valor: `− ${formatBRL(taxas)}`, tom: 'text-crimson-700' },
          { rotulo: 'Líquido em caixa', valor: formatBRL(bruto - taxas), tom: 'text-olive-600' },
        ].map((c) => (
          <div key={c.rotulo} className="card p-5">
            <p className={cn('tabular font-display text-3xl font-semibold', c.tom)}>{c.valor}</p>
            <p className="mt-1 text-[12.5px] uppercase tracking-wider text-ink-400">{c.rotulo}</p>
          </div>
        ))}
      </section>

      {webhooks > 0 ? (
        <p className="mt-4 rounded-xl border border-gold-300 bg-gold-50 p-4 text-[13.5px] text-gold-900">
          {webhooks} {webhooks === 1 ? 'notificação do provedor ainda não foi processada' : 'notificações do provedor ainda não foram processadas'}.
          A rotina de conciliação vai reprocessá-las automaticamente.
        </p>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg text-ink-900">Por forma de pagamento</h2>
          {porMetodo.length ? (
            <ul className="mt-4 space-y-3">
              {porMetodo.map((m) => {
                const valor = m._sum.capturedCents ?? 0;
                const pct = bruto > 0 ? Math.round((valor / bruto) * 100) : 0;
                return (
                  <li key={m.method}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="font-medium text-ink-800">{m.method.replace(/_/g, ' ').toLowerCase()}</span>
                      <span className="tabular text-ink-600">{formatBRL(valor)} · {m._count}x</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gold-sheen" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-ivory-100 p-5 text-center text-[13.5px] text-ink-400">
              Nenhum pagamento capturado neste mês.
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg text-ink-900">Razão contábil</h2>
          {razao.length ? (
            <ul className="mt-4 divide-y divide-ink-100">
              {razao.map((r) => (
                <li key={`${r.account}-${r.direction}`} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                  <span className="text-ink-600">{r.account}</span>
                  <span className={cn('tabular font-medium', r.direction === 'CREDITO' ? 'text-olive-600' : 'text-crimson-700')}>
                    {r.direction === 'CREDITO' ? '+' : '−'} {formatBRL(r._sum.amountCents ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-ivory-100 p-5 text-center text-[13.5px] text-ink-400">
              O razão é alimentado automaticamente a cada pagamento capturado.
            </p>
          )}
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <h2 className="border-b border-ink-100 p-6 font-display text-lg text-ink-900">Últimos pagamentos</h2>
        {pagamentos.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-ivory-100 text-[12px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Pedido</th>
                  <th className="px-6 py-3 font-medium">Comprador</th>
                  <th className="px-6 py-3 font-medium">Forma</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Situação</th>
                  <th className="px-6 py-3 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pagamentos.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-100/60">
                    <td className="px-6 py-3 font-medium text-ink-800">{p.order.code}</td>
                    <td className="px-6 py-3 text-ink-600">{p.order.buyerName}</td>
                    <td className="px-6 py-3 text-ink-500">
                      {p.method.replace(/_/g, ' ').toLowerCase()}
                      {p.installments > 1 ? ` ${p.installments}x` : ''}
                    </td>
                    <td className="tabular px-6 py-3 font-medium text-ink-900">{formatBRL(p.amountCents)}</td>
                    <td className="px-6 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', CORES_STATUS[p.status] ?? 'bg-ink-100 text-ink-500')}>
                        {p.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-ink-400">{relativeTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-10 text-center text-[13.5px] text-ink-400">Nenhum pagamento registrado ainda.</p>
        )}
      </section>
    </div>
  );
}
