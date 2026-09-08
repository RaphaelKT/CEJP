'use client';

import Link from 'next/link';
import { BedDouble, Bus, Check, UtensilsCrossed, Ticket, Clock } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils/format';
import { installmentOptions, PIX_DISCOUNT_BPS } from '@/lib/payments/pricing';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils/cn';

export type Lote = {
  id: string;
  nome: string;
  descricao?: string | null;
  precoCents: number;
  publico: string;
  vagas: number | null;
  incluiHospedagem: boolean;
  incluiRefeicoes: boolean;
  incluiTransporte: boolean;
  encerraEm: string | null;
};

const ROTULO_PUBLICO: Record<string, string> = {
  GERAL: 'Geral',
  MEMBRO: 'Membro MEB',
  CRIANCA: 'Criança',
  ADOLESCENTE: 'Adolescente',
  JOVEM: 'Jovem',
  CASAL: 'Casal',
  TERCEIRA_IDADE: 'Terceira idade',
  VOLUNTARIO: 'Voluntário',
  CONVIDADO: 'Convidado',
};

export function TabelaLotes({
  lotes,
  eventoSlug,
  parcelasMax,
  aberto,
}: {
  lotes: Lote[];
  eventoSlug: string;
  parcelasMax: number;
  aberto: boolean;
}) {
  if (!lotes.length) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-white p-14 text-center">
        <Ticket className="mx-auto mb-4 h-9 w-9 text-gold-400" />
        <p className="font-display text-xl text-ink-900">Valores em breve</p>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-400">
          Os lotes serão divulgados assim que a programação for fechada.
        </p>
      </div>
    );
  }

  const maisBarato = Math.min(...lotes.map((l) => l.precoCents));

  return (
    <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {lotes.map((lote) => {
        const parcelas = installmentOptions(lote.precoCents, parcelasMax);
        const melhorParcela = [...parcelas].reverse().find((p) => p.interestFree) ?? parcelas[0]!;
        const descontoPix = Math.round((lote.precoCents * PIX_DISCOUNT_BPS) / 10_000);
        const destaque = lote.precoCents === maisBarato && lotes.length > 1;
        const esgotado = lote.vagas !== null && lote.vagas <= 0;

        return (
          <RevealItem key={lote.id}>
            <article
              className={cn(
                'card relative flex h-full flex-col p-7',
                destaque && 'ring-foil border-gold-300',
                esgotado && 'opacity-60',
              )}
            >
              {destaque ? (
                <span className="absolute -top-3 left-7 rounded-full bg-gold-sheen px-3 py-1 text-2xs font-bold uppercase tracking-wider text-gold-950">
                  Melhor valor
                </span>
              ) : null}

              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-crimson-700">
                {ROTULO_PUBLICO[lote.publico] ?? lote.publico}
              </p>
              <h3 className="mt-2 font-display text-xl text-ink-900">{lote.nome}</h3>
              {lote.descricao ? (
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{lote.descricao}</p>
              ) : null}

              <div className="mt-6">
                <p className="font-display text-4xl font-semibold leading-none text-ink-900">
                  {formatBRL(lote.precoCents)}
                </p>
                <p className="mt-2 text-[13.5px] text-ink-500">
                  ou {melhorParcela.installments}x de{' '}
                  <strong className="text-ink-800">{formatBRL(melhorParcela.installmentCents)}</strong>{' '}
                  {melhorParcela.interestFree ? 'sem juros' : 'com juros'}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-olive-500/10 px-2.5 py-1 text-[12.5px] font-semibold text-olive-600">
                  {formatBRL(lote.precoCents - descontoPix)} no PIX
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-[13.5px] text-ink-600">
                {lote.incluiHospedagem ? (
                  <li className="flex items-center gap-2.5"><BedDouble className="h-4 w-4 text-gold-600" /> Hospedagem inclusa</li>
                ) : null}
                {lote.incluiRefeicoes ? (
                  <li className="flex items-center gap-2.5"><UtensilsCrossed className="h-4 w-4 text-gold-600" /> Todas as refeições</li>
                ) : null}
                {lote.incluiTransporte ? (
                  <li className="flex items-center gap-2.5"><Bus className="h-4 w-4 text-gold-600" /> Transporte em ônibus fretado</li>
                ) : null}
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-gold-600" /> Material e credencial do evento</li>
                {lote.vagas !== null ? (
                  <li className={cn('flex items-center gap-2.5', lote.vagas < 20 && 'font-semibold text-crimson-700')}>
                    <Ticket className="h-4 w-4 text-gold-600" />
                    {lote.vagas > 0 ? `${lote.vagas} vagas neste lote` : 'Lote esgotado'}
                  </li>
                ) : null}
                {lote.encerraEm ? (
                  <li className="flex items-center gap-2.5 text-ink-400">
                    <Clock className="h-4 w-4" /> Até {formatDate(lote.encerraEm, 'longa')}
                  </li>
                ) : null}
              </ul>

              <div className="mt-auto pt-7">
                {aberto && !esgotado ? (
                  <Link
                    href={`/eventos/${eventoSlug}/inscricao?lote=${lote.id}`}
                    className={cn('w-full', destaque ? 'btn-gold' : 'btn-primary')}
                  >
                    <Ticket className="h-4 w-4" />
                    Escolher este lote
                  </Link>
                ) : (
                  <span className="btn-outline pointer-events-none w-full opacity-60">
                    {esgotado ? 'Esgotado' : 'Inscrições fechadas'}
                  </span>
                )}
              </div>
            </article>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
