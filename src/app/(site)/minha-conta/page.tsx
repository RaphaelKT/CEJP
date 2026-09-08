import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Ticket, CalendarCheck, HandHeart, BadgeCheck, ArrowUpRight, QrCode } from 'lucide-react';
import { prisma, safeQuery } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { formatBRL, formatDate, relativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Minha conta', robots: { index: false } };
export const dynamic = 'force-dynamic';

const ROTULO_ESTAGIO: Record<string, { texto: string; classe: string; descricao: string }> = {
  VISITANTE: { texto: 'Visitante', classe: 'bg-ink-100 text-ink-600', descricao: 'Seja muito bem-vindo! Registre presença nos cultos para caminhar conosco.' },
  FREQUENTADOR: { texto: 'Frequentador', classe: 'bg-gold-100 text-gold-800', descricao: 'Você já está caminhando com a gente. Continue registrando suas presenças.' },
  EM_AVALIACAO: { texto: 'Membresia em confirmação', classe: 'bg-crimson-50 text-crimson-700', descricao: 'Você atingiu o critério de frequência! A secretaria vai te procurar em breve.' },
  MEMBRO: { texto: 'Membro oficial', classe: 'bg-olive-500/15 text-olive-600', descricao: 'Você é membro da Missão Evangélica do Brasil.' },
  MEMBRO_INATIVO: { texto: 'Membro inativo', classe: 'bg-ink-100 text-ink-500', descricao: 'Estamos com saudade. Volte a registrar presença para reativar sua membresia.' },
  DESLIGADO: { texto: 'Desligado', classe: 'bg-ink-100 text-ink-400', descricao: 'Fale com a secretaria para regularizar seu vínculo.' },
};

export default async function MinhaContaPage() {
  const usuario = await getSessionUser().catch(() => null);
  if (!usuario) redirect('/entrar?proximo=/minha-conta');

  const trintaDias = new Date(Date.now() - 30 * 86_400_000);

  const [perfil, inscricoes, presencas, regra] = await Promise.all([
    safeQuery(
      () =>
        prisma.user.findUnique({
          where: { id: usuario.id },
          select: { membershipStage: true, membershipNumber: true, membershipSince: true, createdAt: true, email: true },
        }),
      null,
    ),
    safeQuery(
      () =>
        prisma.registration.findMany({
          where: { userId: usuario.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            edition: { select: { title: true, startsAt: true, endsAt: true, slug: true, event: { select: { slug: true } } } },
            tier: { select: { name: true, priceCents: true } },
          },
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.checkIn.findMany({
          where: { userId: usuario.id, status: 'CONFIRMADO', checkedInAt: { gte: trintaDias } },
          orderBy: { checkedInAt: 'desc' },
          include: { occurrence: { select: { title: true, startsAt: true } } },
        }),
      [],
    ),
    safeQuery(() => prisma.membershipRule.findUnique({ where: { key: 'default' } }), null),
  ]);

  const estagio = perfil?.membershipStage ?? usuario.membershipStage;
  const info = ROTULO_ESTAGIO[estagio] ?? ROTULO_ESTAGIO.VISITANTE!;
  const minimo = regra?.minAttendance ?? 5;
  const progresso = Math.min(100, Math.round((presencas.length / minimo) * 100));

  return (
    <section className="bg-ivory-50 pb-24 pt-[calc(var(--header-h)+48px)]">
      <div className="container max-w-4xl">
        <header className="mb-8">
          <p className="eyebrow mb-2">Minha conta</p>
          <h1 className="font-display text-4xl text-ink-900">Olá, {usuario.fullName.split(' ')[0]}</h1>
          <p className="mt-2 text-[15px] text-ink-500">{perfil?.email ?? usuario.email}</p>
        </header>

        {/* Situação de membresia */}
        <div className="ring-foil card p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-wider', info.classe)}>
              <BadgeCheck className="h-4 w-4" />
              {info.texto}
            </span>
            {perfil?.membershipNumber ? (
              <span className="rounded-full bg-ivory-200 px-3.5 py-1.5 text-[13px] font-medium text-ink-600">
                Matrícula {perfil.membershipNumber}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{info.descricao}</p>

          {estagio !== 'MEMBRO' ? (
            <div className="mt-6">
              <div className="flex items-baseline justify-between text-[13.5px]">
                <span className="text-ink-500">Presenças confirmadas nos últimos 30 dias</span>
                <span className="tabular font-semibold text-ink-900">
                  {presencas.length}/{minimo}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000 ease-expo', progresso >= 100 ? 'bg-olive-500' : 'bg-gold-sheen')}
                  style={{ width: `${Math.max(4, progresso)}%` }}
                />
              </div>
              <p className="mt-2.5 text-[12.5px] text-ink-400">
                Ao chegar ao culto, escaneie o QR exibido no telão para registrar sua presença.
              </p>
            </div>
          ) : perfil?.membershipSince ? (
            <p className="mt-4 text-[13.5px] text-ink-400">
              Membro desde {formatDate(perfil.membershipSince, 'longa')}.
            </p>
          ) : null}

          <Link href="/presenca" className="btn-primary mt-6">
            <QrCode className="h-4 w-4" /> Registrar presença
          </Link>
        </div>

        {/* Inscrições */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-2xl text-ink-900">
            <Ticket className="h-5 w-5 text-gold-600" /> Minhas inscrições
          </h2>

          {inscricoes.length ? (
            <ul className="mt-4 space-y-3">
              {inscricoes.map((i) => (
                <li key={i.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight text-ink-900">{i.edition.title}</p>
                    <p className="mt-1 text-[13.5px] text-ink-500">
                      {i.tier.name} · {formatDate(i.edition.startsAt, 'longa')}
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-400">Código {i.code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider',
                        i.status === 'CONFIRMADA' || i.status === 'CHECK_IN_REALIZADO' ? 'bg-olive-500/15 text-olive-600'
                          : i.status === 'AGUARDANDO_PAGAMENTO' ? 'bg-gold-100 text-gold-800'
                            : 'bg-ink-100 text-ink-500',
                      )}
                    >
                      {i.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <Link href={`/eventos/${i.edition.event.slug}`} className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-gold-400">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
              <p className="text-[14.5px] text-ink-400">Você ainda não tem inscrições.</p>
              <Link href="/eventos" className="btn-outline mt-5">Ver eventos abertos</Link>
            </div>
          )}
        </section>

        {/* Presenças */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-2xl text-ink-900">
            <CalendarCheck className="h-5 w-5 text-gold-600" /> Presenças recentes
          </h2>

          {presencas.length ? (
            <ul className="mt-4 divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
              {presencas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-medium text-ink-800">{p.occurrence.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">{formatDate(p.occurrence.startsAt, 'completa')}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-ink-300">{relativeTime(p.checkedInAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-[14.5px] text-ink-400">
              Nenhuma presença registrada nos últimos 30 dias.
            </p>
          )}
        </section>

        <section className="mt-8">
          <Link href="/mural" className="card card-hover flex items-center gap-4 p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-crimson-deep text-ivory-50">
              <HandHeart className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg text-ink-900">Mural de orações</span>
              <span className="mt-0.5 block text-[13.5px] text-ink-400">
                Compartilhe um pedido ou interceda por alguém agora.
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-300" />
          </Link>
        </section>
      </div>
    </section>
  );
}
