import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CalendarDays, MapPin, Users, Ticket, ArrowRight, Check, CreditCard,
  ShieldCheck, Sparkles, Clock,
} from 'lucide-react';
import { Ornament, SectionHeading } from '@/components/ui/Section';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { GaleriaEdicoes } from '@/components/eventos/GaleriaEdicoes';
import { TabelaLotes } from '@/components/eventos/TabelaLotes';
import { lerEventoPorSlug } from '@/lib/queries';
import { formatDateRange, formatDate } from '@/lib/utils/format';
import { GALERIA_DEMO } from '@/lib/site/media-demo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const evento = await lerEventoPorSlug(slug);
  if (!evento) return { title: 'Evento não encontrado' };
  return {
    title: evento.name,
    description: evento.summary,
    openGraph: { title: evento.name, description: evento.summary, images: evento.heroImageUrl ? [evento.heroImageUrl] : [] },
  };
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await lerEventoPorSlug(slug);
  if (!evento) notFound();

  const [edicaoAtual, ...anteriores] = evento.editions;
  if (!edicaoAtual) notFound();

  const aberto = edicaoAtual.status === 'INSCRICOES_ABERTAS';
  const destaques = (edicaoAtual.highlights as string[] | null) ?? [];
  const vagas = edicaoAtual.capacity > 0 ? Math.max(0, edicaoAtual.capacity - edicaoAtual.soldCount) : null;
  const capa = edicaoAtual.coverImageUrl ?? evento.heroImageUrl ?? GALERIA_DEMO[0]!;

  const galerias = anteriores.length
    ? anteriores.map((ed) => ({
        ano: ed.year,
        titulo: ed.title,
        fotos: ed.galleries.flatMap((g) => g.items.map((i) => ({ url: i.asset.url, legenda: i.caption ?? undefined }))),
      }))
    : [
        { ano: edicaoAtual.year - 1, titulo: `${evento.name} ${edicaoAtual.year - 1}`, fotos: GALERIA_DEMO.slice(0, 6).map((url) => ({ url })) },
        { ano: edicaoAtual.year - 2, titulo: `${evento.name} ${edicaoAtual.year - 2}`, fotos: GALERIA_DEMO.slice(2, 8).map((url) => ({ url })) },
      ];

  return (
    <>
      {/* ---------- Capa ---------- */}
      <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-ink-950 pb-16 pt-[var(--header-h)]">
        <Image src={capa} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/25" />

        <div className="container relative">
          <Link href="/eventos" className="mb-6 inline-flex items-center gap-2 text-[13.5px] text-ivory-200/70 transition-colors hover:text-gold-300">
            ← Todos os eventos
          </Link>

          <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.22em] text-gold-400">
            {evento.category.replace(/_/g, ' ')} · Edição {edicaoAtual.year}
          </p>

          <h1 className="max-w-4xl text-display text-ivory-50 text-shadow-hero">{evento.name}</h1>

          {evento.tagline ? (
            <p className="mt-4 font-display text-xl text-gold-200 sm:text-2xl">{evento.tagline}</p>
          ) : null}

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-ivory-200/85">
            <li className="flex items-center gap-2.5">
              <CalendarDays className="h-[18px] w-[18px] text-gold-400" />
              {formatDateRange(edicaoAtual.startsAt, edicaoAtual.endsAt)}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="h-[18px] w-[18px] text-gold-400" />
              {edicaoAtual.locationLabel ?? edicaoAtual.venue?.name ?? 'Local a confirmar'}
            </li>
            {vagas !== null ? (
              <li className="flex items-center gap-2.5">
                <Users className="h-[18px] w-[18px] text-gold-400" />
                {vagas > 0 ? `${vagas} vagas disponíveis` : 'Vagas esgotadas'}
              </li>
            ) : null}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {aberto ? (
              <Link href={`/eventos/${evento.slug}/inscricao`} className="btn-gold group text-[15px] !px-8 !py-4">
                <Ticket className="h-[18px] w-[18px]" />
                Garantir minha vaga
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ) : (
              <span className="btn border border-ivory-50/25 text-ivory-100">
                <Clock className="h-4 w-4" />
                {edicaoAtual.status === 'INSCRICOES_EM_BREVE' ? 'Inscrições em breve' : 'Inscrições encerradas'}
              </span>
            )}
            <a href="#lotes" className="btn border border-ivory-50/25 text-ivory-50 hover:border-gold-300/70 hover:bg-ivory-50/5">
              Ver valores e lotes
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Sobre a edição ---------- */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <Reveal>
              <p className="eyebrow mb-4">Sobre o evento</p>
              <h2 className="text-headline text-ink-900">{edicaoAtual.title}</h2>
              {edicaoAtual.theme ? (
                <p className="mt-3 font-display text-xl text-crimson-700">“{edicaoAtual.theme}”</p>
              ) : null}

              <div className="mt-7 space-y-5 text-[16.5px] leading-relaxed text-ink-600">
                {evento.description.split('\n\n').map((paragrafo, i) => (
                  <p key={i}>{paragrafo}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="sticky top-[calc(var(--header-h)+24px)] space-y-5">
                <div className="ring-foil card p-7">
                  <p className="eyebrow mb-5">Informações rápidas</p>
                  <dl className="space-y-4 text-[14.5px]">
                    {[
                      ['Data', formatDateRange(edicaoAtual.startsAt, edicaoAtual.endsAt)],
                      ['Local', edicaoAtual.locationLabel ?? edicaoAtual.venue?.name ?? 'A confirmar'],
                      ['Capacidade', edicaoAtual.capacity > 0 ? `${edicaoAtual.capacity} pessoas` : 'Sem limite'],
                      ['Parcelamento', `Em até ${edicaoAtual.installmentsMax}x no cartão`],
                      edicaoAtual.registrationClosesAt
                        ? ['Inscrições até', formatDate(edicaoAtual.registrationClosesAt, 'longa')]
                        : null,
                    ]
                      .filter((x): x is [string, string] => Boolean(x))
                      .map(([rotulo, valor]) => (
                        <div key={rotulo} className="flex items-start justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                          <dt className="shrink-0 text-ink-400">{rotulo}</dt>
                          <dd className="text-right font-medium text-ink-900">{valor}</dd>
                        </div>
                      ))}
                  </dl>
                </div>

                {destaques.length ? (
                  <div className="card p-7">
                    <p className="eyebrow mb-4">O que está incluso</p>
                    <ul className="space-y-3">
                      {destaques.map((d) => (
                        <li key={d} className="flex gap-3 text-[14.5px] text-ink-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-500" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="card bg-crimson-deep p-7 text-ivory-100">
                  <ShieldCheck className="mb-4 h-6 w-6 text-gold-300" />
                  <p className="font-display text-lg">Inscrição segura</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ivory-200/75">
                    Pagamento processado com criptografia ponta a ponta. Não armazenamos dados do seu
                    cartão. Reembolso conforme política publicada.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Lotes ---------- */}
      <section id="lotes" className="section scroll-mt-24 bg-ivory-veil">
        <div className="container">
          <SectionHeading
            eyebrow="Valores"
            title={<>Escolha o seu <span className="text-gold-foil">lote</span></>}
            description="Quanto antes você se inscreve, menos paga. Membros com carteirinha ativa têm condições especiais."
            align="center"
          />
          <TabelaLotes
            lotes={edicaoAtual.ticketTiers.map((t) => ({
              id: t.id,
              nome: t.name,
              descricao: t.description,
              precoCents: t.priceCents,
              publico: t.audience,
              vagas: t.quantityTotal > 0 ? Math.max(0, t.quantityTotal - t.quantitySold) : null,
              incluiHospedagem: t.includesLodging,
              incluiRefeicoes: t.includesMeals,
              incluiTransporte: t.includesTransport,
              encerraEm: t.salesEndAt?.toISOString() ?? null,
            }))}
            eventoSlug={evento.slug}
            parcelasMax={edicaoAtual.installmentsMax}
            aberto={aberto}
          />
        </div>
      </section>

      {/* ---------- Galeria de edições anteriores ---------- */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Memória"
            title={<>Edições <span className="text-gold-foil">anteriores</span></>}
            description="As fotos são publicadas pela nossa equipe de mídia, com conferência automática de local e data antes de entrar no site."
          />
          <GaleriaEdicoes galerias={galerias} />
        </div>
      </section>

      {/* ---------- Chamada final ---------- */}
      {aberto ? (
        <section className="relative overflow-hidden bg-ink-950 py-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(200,153,43,.6), transparent 60%)' }}
            aria-hidden
          />
          <div className="container relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Ornament className="mb-8" />
              <h2 className="text-headline text-ivory-50">
                {vagas && vagas < 60 ? 'As últimas vagas estão indo rápido' : 'Sua vaga está esperando'}
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ivory-200/70">
                Inscreva-se em menos de dois minutos. PIX com {5}% de desconto, cartão em até{' '}
                {edicaoAtual.installmentsMax}x ou boleto.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href={`/eventos/${evento.slug}/inscricao`} className="btn-gold group !px-8 !py-4 text-[15px]">
                  <Sparkles className="h-[18px] w-[18px]" />
                  Fazer minha inscrição
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <span className="flex items-center gap-2 text-[13.5px] text-ivory-200/50">
                  <CreditCard className="h-4 w-4" /> PIX · Cartão · Boleto
                </span>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
