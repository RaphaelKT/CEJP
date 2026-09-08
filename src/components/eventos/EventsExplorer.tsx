'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, CalendarX2 } from 'lucide-react';
import { EventCard, type EventoResumo } from './EventCard';
import { cn } from '@/lib/utils/cn';

const CATEGORIAS: { valor: string; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'RETIRO', rotulo: 'Retiros' },
  { valor: 'ENCONTRO_JOVENS', rotulo: 'Juventude' },
  { valor: 'MISSAO', rotulo: 'Missões' },
  { valor: 'CONGRESSO', rotulo: 'Congressos' },
  { valor: 'ACAMPAMENTO', rotulo: 'Acampamentos' },
  { valor: 'CONFERENCIA', rotulo: 'Conferências' },
  { valor: 'ACAO_SOCIAL', rotulo: 'Ação social' },
];

const SITUACOES = [
  { valor: 'TODOS', rotulo: 'Todas as situações' },
  { valor: 'INSCRICOES_ABERTAS', rotulo: 'Inscrições abertas' },
  { valor: 'INSCRICOES_EM_BREVE', rotulo: 'Em breve' },
  { valor: 'REALIZADO', rotulo: 'Já realizados' },
];

export function EventsExplorer({ eventos }: { eventos: EventoResumo[] }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('TODOS');
  const [situacao, setSituacao] = useState('TODOS');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return eventos.filter((e) => {
      if (categoria !== 'TODOS' && e.categoria !== categoria) return false;
      if (situacao !== 'TODOS' && e.status !== situacao) return false;
      if (!termo) return true;
      return [e.nome, e.tagline, e.resumo, e.local, String(e.ano)]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo));
    });
  }, [eventos, busca, categoria, situacao]);

  return (
    <div>
      <div className="mb-10 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-300" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, tema ou local…"
              className="field !pl-12"
              aria-label="Buscar eventos"
            />
          </div>
          <div className="relative sm:w-64">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-300" />
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="field !pl-12 appearance-none"
              aria-label="Filtrar por situação"
            >
              {SITUACOES.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {CATEGORIAS.map((c) => (
            <button
              key={c.valor}
              onClick={() => setCategoria(c.valor)}
              aria-pressed={categoria === c.valor}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-300',
                categoria === c.valor
                  ? 'bg-ink-900 text-ivory-50 shadow-soft'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-gold-300',
              )}
            >
              {c.rotulo}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-6 text-[13.5px] text-ink-400">
        {filtrados.length === eventos.length
          ? `${eventos.length} eventos no calendário`
          : `${filtrados.length} de ${eventos.length} eventos`}
      </p>

      {filtrados.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-white/60 p-16 text-center">
          <CalendarX2 className="mx-auto mb-4 h-10 w-10 text-gold-400" />
          <p className="font-display text-xl text-ink-900">Nenhum evento encontrado</p>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-400">
            Tente outro termo de busca ou remova os filtros aplicados.
          </p>
          <button
            onClick={() => {
              setBusca('');
              setCategoria('TODOS');
              setSituacao('TODOS');
            }}
            className="btn-outline mt-6"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtrados.map((evento, i) => (
              <motion.div
                key={evento.editionSlug}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
              >
                <EventCard evento={evento} prioridade={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
