import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Ticket, Users } from 'lucide-react';
import { formatBRL, formatDateRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export type EventoResumo = {
  slug: string;
  editionSlug: string;
  nome: string;
  tagline?: string | null;
  categoria: string;
  resumo: string;
  capa: string;
  ano: number;
  inicio: string;
  fim: string;
  local: string;
  status: string;
  precoDesdeCents: number | null;
  vagasRestantes: number | null;
  capacidade: number;
  vendidos: number;
  destaque?: boolean;
};

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  INSCRICOES_ABERTAS: { texto: 'Inscrições abertas', classe: 'bg-olive-500/15 text-olive-600 ring-olive-500/30' },
  INSCRICOES_EM_BREVE: { texto: 'Em breve', classe: 'bg-gold-100 text-gold-800 ring-gold-300' },
  LISTA_DE_ESPERA: { texto: 'Lista de espera', classe: 'bg-crimson-50 text-crimson-700 ring-crimson-200' },
  INSCRICOES_ENCERRADAS: { texto: 'Encerradas', classe: 'bg-ink-100 text-ink-500 ring-ink-200' },
  REALIZADO: { texto: 'Realizado', classe: 'bg-ink-100 text-ink-500 ring-ink-200' },
  EM_ANDAMENTO: { texto: 'Acontecendo agora', classe: 'bg-crimson-600/15 text-crimson-700 ring-crimson-400/40' },
  CANCELADO: { texto: 'Cancelado', classe: 'bg-ink-100 text-ink-400 ring-ink-200' },
};

export function EventCard({ evento, prioridade = false }: { evento: EventoResumo; prioridade?: boolean }) {
  const status = ROTULO_STATUS[evento.status] ?? ROTULO_STATUS.INSCRICOES_EM_BREVE!;
  const ocupacao = evento.capacidade > 0 ? Math.min(100, Math.round((evento.vendidos / evento.capacidade) * 100)) : 0;
  const quaseEsgotado = ocupacao >= 80 && evento.status === 'INSCRICOES_ABERTAS';

  return (
    <article className="group card card-hover relative flex h-full flex-col overflow-hidden">
      <Link href={`/eventos/${evento.slug}`} className="absolute inset-0 z-10" aria-label={`Ver detalhes de ${evento.nome}`}>
        <span className="sr-only">Ver detalhes</span>
      </Link>

      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={evento.capa}
          alt=""
          fill
          priority={prioridade}
          sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={cn('rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-wider ring-1 backdrop-blur-sm', status.classe)}>
            {status.texto}
          </span>
          {quaseEsgotado ? (
            <span className="rounded-full bg-crimson-700 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-white">
              Últimas vagas
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            {evento.categoria.replace(/_/g, ' ')} · {evento.ano}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight text-ivory-50 text-shadow-hero">
            {evento.nome}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {evento.tagline ? (
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-crimson-700">{evento.tagline}</p>
        ) : null}

        <p className="text-[14.5px] leading-relaxed text-ink-500 line-clamp-3">{evento.resumo}</p>

        <ul className="mt-5 space-y-2.5 text-[13.5px] text-ink-600">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-gold-600" />
            {formatDateRange(evento.inicio, evento.fim)}
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-gold-600" />
            <span className="truncate">{evento.local}</span>
          </li>
          {evento.capacidade > 0 ? (
            <li className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-gold-600" />
              {evento.vagasRestantes !== null && evento.vagasRestantes > 0
                ? `${evento.vagasRestantes} vagas disponíveis`
                : 'Vagas esgotadas'}
            </li>
          ) : null}
        </ul>

        {evento.capacidade > 0 && evento.status === 'INSCRICOES_ABERTAS' ? (
          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn('h-full rounded-full transition-all duration-700', quaseEsgotado ? 'bg-crimson-600' : 'bg-gold-sheen')}
                style={{ width: `${Math.max(4, ocupacao)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-ink-400">{ocupacao}% das vagas preenchidas</p>
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {evento.precoDesdeCents !== null ? (
              <>
                <p className="text-[12px] uppercase tracking-wider text-ink-400">A partir de</p>
                <p className="font-display text-2xl font-semibold text-ink-900">
                  {formatBRL(evento.precoDesdeCents)}
                </p>
              </>
            ) : (
              <p className="text-[13.5px] font-medium text-ink-400">Valores em breve</p>
            )}
          </div>

          <span className="relative z-20 flex items-center gap-2">
            {evento.status === 'INSCRICOES_ABERTAS' ? (
              <Link
                href={`/eventos/${evento.slug}/inscricao`}
                className="btn-primary !px-4 !py-2.5 text-[13px]"
              >
                <Ticket className="h-4 w-4" />
                Inscrever-se
              </Link>
            ) : null}
            <span className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 text-ink-500 transition-all duration-300 group-hover:border-gold-400 group-hover:bg-gold-50 group-hover:text-gold-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
