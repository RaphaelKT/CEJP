import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, Church, HandHeart, Wallet, TrendingUp, Camera, CalendarCheck,
  AlertTriangle, ArrowUpRight, QrCode,
} from 'lucide-react';
import { prisma, safeQuery } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { permissionsFor, PERMISSIONS } from '@/lib/auth/rbac';
import { formatBRL, formatNumber, relativeTime } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Painel', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PainelPage() {
  const usuario = await getSessionUser();
  const permissoes = permissionsFor(usuario?.roles ?? []);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [membros, emAvaliacao, igrejas, presencasMes, pedidosAbertos, moderacaoAberta, receitaMes, ultimosEventos] =
    await Promise.all([
      safeQuery(() => prisma.user.count({ where: { membershipStage: 'MEMBRO' } }), 0),
      safeQuery(() => prisma.user.count({ where: { membershipStage: 'EM_AVALIACAO' } }), 0),
      safeQuery(() => prisma.church.count({ where: { official: true, closedAt: null } }), 0),
      safeQuery(() => prisma.checkIn.count({ where: { status: 'CONFIRMADO', checkedInAt: { gte: inicioMes } } }), 0),
      safeQuery(() => prisma.prayerRequest.count({ where: { status: 'PUBLICADO' } }), 0),
      safeQuery(() => prisma.moderationCase.count({ where: { status: 'ABERTO' } }), 0),
      safeQuery(
        () =>
          prisma.payment.aggregate({
            where: { status: 'CAPTURADO', capturedAt: { gte: inicioMes } },
            _sum: { capturedCents: true },
          }),
        { _sum: { capturedCents: 0 } },
      ),
      safeQuery(
        () =>
          prisma.membershipEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: { user: { select: { fullName: true } } },
          }),
        [],
      ),
    ]);

  const cartoes = [
    { rotulo: 'Membros oficiais', valor: formatNumber(membros), Icon: Users, cor: 'text-crimson-700', fundo: 'bg-crimson-50' },
    { rotulo: 'Igrejas oficiais', valor: formatNumber(igrejas), Icon: Church, cor: 'text-gold-700', fundo: 'bg-gold-100' },
    { rotulo: 'Presenças no mês', valor: formatNumber(presencasMes), Icon: CalendarCheck, cor: 'text-olive-600', fundo: 'bg-olive-500/12' },
    { rotulo: 'Pedidos no mural', valor: formatNumber(pedidosAbertos), Icon: HandHeart, cor: 'text-ink-700', fundo: 'bg-ink-100' },
  ];

  const pendencias = [
    emAvaliacao > 0 && permissoes.has(PERMISSIONS.MEMBRESIA_APROVAR)
      ? {
          titulo: `${emAvaliacao} ${emAvaliacao === 1 ? 'cadastro atingiu' : 'cadastros atingiram'} o gatilho de membresia`,
          texto: 'Confirme com a pessoa e efetive a membresia.',
          href: '/painel/membresia',
        }
      : null,
    moderacaoAberta > 0 && permissoes.has(PERMISSIONS.MURAL_MODERAR)
      ? {
          titulo: `${moderacaoAberta} ${moderacaoAberta === 1 ? 'item aguarda' : 'itens aguardam'} moderação`,
          texto: 'Pedidos do mural ou lotes de fotos na fila humana.',
          href: '/painel/mural',
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">Visão geral</p>
        <h1 className="font-display text-3xl text-ink-900">
          Olá, {usuario?.fullName.split(' ')[0]}
        </h1>
        <p className="mt-2 text-[15px] text-ink-500">Um resumo do que está acontecendo na igreja hoje.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map(({ rotulo, valor, Icon, cor, fundo }) => (
          <div key={rotulo} className="card p-5">
            <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${fundo}`}>
              <Icon className={`h-[18px] w-[18px] ${cor}`} />
            </span>
            <p className="tabular font-display text-3xl font-semibold text-ink-900">{valor}</p>
            <p className="mt-1 text-[12.5px] uppercase tracking-wider text-ink-400">{rotulo}</p>
          </div>
        ))}
      </section>

      {permissoes.has(PERMISSIONS.FINANCEIRO_LER) ? (
        <section className="card mt-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Financeiro do mês</p>
              <p className="tabular font-display text-4xl font-semibold text-ink-900">
                {formatBRL(receitaMes._sum.capturedCents ?? 0)}
              </p>
              <p className="mt-1.5 text-[13.5px] text-ink-400">Recebido em inscrições e doações</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100">
              <Wallet className="h-5 w-5 text-gold-700" />
            </span>
          </div>
          <Link href="/painel/financeiro" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-gold-700 hover:text-gold-800">
            Ver conciliação completa <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      {pendencias.length ? (
        <section className="mt-6 space-y-3">
          {pendencias.map((p) => (
            <Link key={p.href} href={p.href} className="card card-hover flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-crimson-50">
                <AlertTriangle className="h-[18px] w-[18px] text-crimson-700" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-ink-900">{p.titulo}</span>
                <span className="mt-0.5 block text-[13px] text-ink-400">{p.texto}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-300" />
            </Link>
          ))}
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink-900">
            <TrendingUp className="h-[18px] w-[18px] text-gold-600" />
            Movimentação de membresia
          </h2>
          {ultimosEventos.length ? (
            <ul className="mt-4 divide-y divide-ink-100">
              {ultimosEventos.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink-800">{e.user.fullName}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">
                      {e.type.replace(/_/g, ' ').toLowerCase()}
                      {e.toStage ? ` → ${e.toStage.replace(/_/g, ' ').toLowerCase()}` : ''}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11.5px] text-ink-300">{relativeTime(e.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-ivory-100 p-5 text-center text-[13.5px] text-ink-400">
              Nenhuma movimentação registrada ainda. Assim que as presenças começarem a ser
              registradas, o motor de membresia aparece aqui.
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg text-ink-900">Atalhos</h2>
          <div className="mt-4 grid gap-2.5">
            {[
              { href: '/painel/totem', label: 'Abrir totem de presença', Icon: QrCode, ativo: permissoes.has(PERMISSIONS.PRESENCA_REGISTRAR) },
              { href: '/painel/midia', label: 'Publicar fotos de um evento', Icon: Camera, ativo: permissoes.has(PERMISSIONS.MIDIA_ENVIAR) },
              { href: '/painel/membresia', label: 'Confirmar membresias pendentes', Icon: Users, ativo: permissoes.has(PERMISSIONS.MEMBRESIA_APROVAR) },
              { href: '/painel/mural', label: 'Moderar o mural de orações', Icon: HandHeart, ativo: permissoes.has(PERMISSIONS.MURAL_MODERAR) },
              { href: '/painel/financeiro', label: 'Conciliar pagamentos', Icon: Wallet, ativo: permissoes.has(PERMISSIONS.FINANCEIRO_LER) },
            ]
              .filter((a) => a.ativo)
              .map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5 text-[14px] text-ink-700 transition-colors hover:border-gold-300 hover:bg-gold-50/50">
                  <Icon className="h-[18px] w-[18px] text-gold-600" />
                  {label}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
