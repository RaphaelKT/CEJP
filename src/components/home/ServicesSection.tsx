'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users2, ArrowRight, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/Section';
import { weekdayName, WEEKDAYS_SHORT } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export type Culto = {
  weekday: number;
  startTime: string;
  endTime?: string | null;
  title: string;
  audience?: string | null;
  description?: string | null;
  highlight: boolean;
  kind: string;
};

const CORES_POR_TIPO: Record<string, string> = {
  CULTO_CELEBRACAO: 'from-crimson-700 to-bordeaux-500',
  CULTO_ORACAO: 'from-gold-600 to-gold-800',
  CULTO_ENSINO: 'from-ink-700 to-ink-900',
  ESCOLA_BIBLICA: 'from-olive-500 to-olive-600',
  CULTO_JOVENS: 'from-crimson-600 to-gold-700',
  VIGILIA: 'from-ink-800 to-crimson-900',
  CULTO_INFANTIL: 'from-gold-400 to-crimson-500',
  CELULA: 'from-ink-600 to-ink-800',
};

export function ServicesSection({ cultos }: { cultos: Culto[] }) {
  const hoje = new Date().getDay();
  const [diaAtivo, setDiaAtivo] = useState<number | 'todos'>('todos');

  const diasComCulto = [...new Set(cultos.map((c) => c.weekday))].sort();
  const filtrados = diaAtivo === 'todos' ? cultos : cultos.filter((c) => c.weekday === diaAtivo);

  return (
    <section id="cultos" className="section relative overflow-hidden bg-ivory-veil scroll-mt-24">
      <div
        className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(circle,#A31621,transparent 70%)' }}
        aria-hidden
      />

      <div className="container relative">
        <SectionHeading
          eyebrow="Programação semanal"
          title={
            <>
              Nossa porta está aberta <span className="text-gold-foil">a semana inteira</span>
            </>
          }
          description="Escolha o dia que cabe na sua rotina. Não precisa avisar, não precisa se arrumar — só venha do jeito que você está."
          action={
            <Link href="/cultos" className="btn-outline group">
              Programação completa
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />

        {/* Filtro por dia */}
        <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setDiaAtivo('todos')}
            className={cn(
              'shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-300',
              diaAtivo === 'todos'
                ? 'bg-ink-900 text-ivory-50 shadow-soft'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-gold-300',
            )}
          >
            Todos os dias
          </button>
          {diasComCulto.map((dia) => (
            <button
              key={dia}
              onClick={() => setDiaAtivo(dia)}
              className={cn(
                'relative shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-300',
                diaAtivo === dia
                  ? 'bg-ink-900 text-ivory-50 shadow-soft'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-gold-300',
              )}
            >
              {WEEKDAYS_SHORT[dia]}
              {dia === hoje ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold-400" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-500" />
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <motion.ul layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtrados.map((culto, i) => {
              const ehHoje = culto.weekday === hoje;
              return (
                <motion.li
                  key={`${culto.weekday}-${culto.startTime}-${culto.title}`}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <article
                    className={cn(
                      'group card card-hover relative flex h-full flex-col overflow-hidden p-6',
                      ehHoje && 'ring-1 ring-gold-300',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80',
                        CORES_POR_TIPO[culto.kind] ?? 'from-gold-500 to-crimson-600',
                      )}
                      aria-hidden
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-crimson-700">
                          {weekdayName(culto.weekday)}
                        </p>
                        <p className="tabular mt-1.5 font-display text-3xl font-semibold text-ink-900">
                          {culto.startTime}
                          {culto.endTime ? (
                            <span className="ml-1 text-base font-normal text-ink-300">–{culto.endTime}</span>
                          ) : null}
                        </p>
                      </div>
                      {ehHoje ? (
                        <span className="shrink-0 rounded-full bg-gold-100 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-gold-800">
                          Hoje
                        </span>
                      ) : culto.highlight ? (
                        <span className="shrink-0 rounded-full bg-crimson-50 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-crimson-700">
                          Destaque
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-5 font-display text-xl leading-snug text-ink-900">{culto.title}</h3>

                    {culto.description ? (
                      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">{culto.description}</p>
                    ) : null}

                    <div className="mt-auto flex items-center gap-4 pt-6 text-[13px] text-ink-400">
                      {culto.audience ? (
                        <span className="flex items-center gap-1.5">
                          <Users2 className="h-3.5 w-3.5" />
                          {culto.audience}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {culto.endTime ? 'Duração prevista' : 'Cerca de 1h30'}
                      </span>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-gold-300 bg-gold-50/40 p-6 text-center">
          <CalendarPlus className="h-5 w-5 text-gold-600" />
          <p className="text-[14.5px] text-ink-600">
            Quer receber a programação no seu calendário?
          </p>
          <a href="/api/calendario/cultos.ics" className="btn-outline !px-4 !py-2 text-[13px]" download>
            Baixar agenda (.ics)
          </a>
        </div>
      </div>
    </section>
  );
}
