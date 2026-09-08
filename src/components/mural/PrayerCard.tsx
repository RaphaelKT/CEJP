'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHeart, MessageCircleHeart, ChevronDown, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { relativeTime } from '@/lib/utils/format';
import { CATEGORIAS, RESPOSTAS_RAPIDAS } from '@/lib/prayer-ui';

export type PedidoPublico = {
  id: string;
  publicId: string;
  category: string;
  title: string | null;
  body: string;
  displayName: string | null;
  anonymous: boolean;
  urgent: boolean;
  prayerCount: number;
  replyCount: number;
  createdAt: string;
  jaOrei: boolean;
  answered: boolean;
  replies: { id: string; body: string; displayName: string | null; createdAt: string }[];
};

/** Paleta suave por categoria — todas derivadas do dourado/carmim/marfim. */
const TONS: Record<string, { chip: string; borda: string; fundo: string }> = {
  SAUDE: { chip: 'bg-crimson-50 text-crimson-700', borda: 'hover:border-crimson-200', fundo: 'from-crimson-50/50' },
  FAMILIA: { chip: 'bg-gold-50 text-gold-800', borda: 'hover:border-gold-300', fundo: 'from-gold-50/60' },
  TRABALHO_E_PROVISAO: { chip: 'bg-olive-500/10 text-olive-600', borda: 'hover:border-olive-400/50', fundo: 'from-olive-400/10' },
  ESTUDOS: { chip: 'bg-ink-100 text-ink-600', borda: 'hover:border-ink-300', fundo: 'from-ink-50' },
  ESPIRITUAL: { chip: 'bg-gold-100 text-gold-800', borda: 'hover:border-gold-400', fundo: 'from-gold-100/50' },
  RELACIONAMENTOS: { chip: 'bg-crimson-50 text-crimson-600', borda: 'hover:border-crimson-200', fundo: 'from-crimson-50/40' },
  LUTO: { chip: 'bg-ink-100 text-ink-600', borda: 'hover:border-ink-300', fundo: 'from-ink-50' },
  GRATIDAO: { chip: 'bg-gold-100 text-gold-900', borda: 'hover:border-gold-400', fundo: 'from-gold-100/60' },
  OUTRO: { chip: 'bg-ivory-300 text-ink-600', borda: 'hover:border-gold-300', fundo: 'from-ivory-200/60' },
};

export function PrayerCard({ pedido, indice = 0 }: { pedido: PedidoPublico; indice?: number }) {
  const [orando, setOrando] = useState(pedido.jaOrei);
  const [total, setTotal] = useState(pedido.prayerCount);
  const [expandido, setExpandido] = useState(false);
  const [respostas, setRespostas] = useState(pedido.replies);
  const [texto, setTexto] = useState('');
  const [enviando, iniciarEnvio] = useTransition();
  const [pulso, setPulso] = useState(false);

  const categoria = CATEGORIAS.find((c) => c.valor === pedido.category) ?? CATEGORIAS.at(-1)!;
  const tom = TONS[pedido.category] ?? TONS.OUTRO!;

  const alternarOracao = async () => {
    const proximo = !orando;
    setOrando(proximo);
    setTotal((t) => t + (proximo ? 1 : -1));
    if (proximo) {
      setPulso(true);
      setTimeout(() => setPulso(false), 900);
    }
    try {
      const res = await fetch(`/api/mural/${pedido.publicId}/orar`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const dados = (await res.json()) as { orando: boolean; total: number };
      setOrando(dados.orando);
      setTotal(dados.total);
    } catch {
      setOrando(!proximo); // rollback otimista
      setTotal((t) => t - (proximo ? 1 : -1));
    }
  };

  const enviarResposta = (corpo: string) => {
    if (!corpo.trim()) return;
    iniciarEnvio(async () => {
      try {
        const res = await fetch(`/api/mural/${pedido.publicId}/responder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: corpo, anonymous: true }),
        });
        if (!res.ok) return;
        const dados = (await res.json()) as { resposta: { id: string; body: string; createdAt: string } };
        setRespostas((r) => [
          ...r,
          { id: dados.resposta.id, body: dados.resposta.body, displayName: null, createdAt: dados.resposta.createdAt },
        ]);
        setTexto('');
      } catch {
        /* silencioso — o usuário pode tentar de novo */
      }
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: Math.min(indice * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative flex break-inside-avoid flex-col overflow-hidden rounded-[22px] border border-ink-100 bg-white p-6 shadow-soft transition-all duration-500 ease-expo hover:-translate-y-0.5 hover:shadow-lift',
        tom.borda,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-70', tom.fundo)} aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold', tom.chip)}>
          <span aria-hidden>{categoria.emoji}</span>
          {categoria.rotulo}
        </span>
        <div className="flex items-center gap-2">
          {pedido.urgent ? (
            <span className="rounded-full bg-crimson-700 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white">
              Urgente
            </span>
          ) : null}
          <time className="text-[12px] text-ink-300" dateTime={pedido.createdAt}>
            {relativeTime(pedido.createdAt)}
          </time>
        </div>
      </div>

      {pedido.title ? (
        <h3 className="relative mt-4 font-display text-lg leading-snug text-ink-900">{pedido.title}</h3>
      ) : null}

      <p className="relative mt-3 whitespace-pre-line text-[15px] leading-[1.7] text-ink-700">{pedido.body}</p>

      {pedido.answered ? (
        <p className="relative mt-4 flex items-start gap-2 rounded-2xl bg-olive-500/10 p-3.5 text-[13.5px] text-olive-600">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">Oração respondida!</strong> Este irmão voltou para contar o
            que Deus fez.
          </span>
        </p>
      ) : null}

      <p className="relative mt-5 flex items-center gap-1.5 text-[12.5px] text-ink-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        {pedido.anonymous ? 'Compartilhado anonimamente' : `Por ${pedido.displayName ?? 'um irmão'}`}
      </p>

      <div className="relative mt-5 flex items-center gap-2 border-t border-ink-100 pt-5">
        <button
          onClick={alternarOracao}
          aria-pressed={orando}
          className={cn(
            'group/btn relative inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition-all duration-300 active:scale-[.97]',
            orando
              ? 'bg-crimson-700 text-ivory-50 shadow-crimson'
              : 'border border-ink-200 text-ink-700 hover:border-crimson-300 hover:bg-crimson-50/60 hover:text-crimson-700',
          )}
        >
          <HandHeart className={cn('h-4 w-4 transition-transform duration-300', pulso && 'scale-125')} />
          {orando ? 'Estou orando' : 'Orar por isso'}
          <span className={cn('tabular ml-0.5 rounded-full px-2 py-0.5 text-[11.5px] font-bold', orando ? 'bg-ivory-50/20' : 'bg-ink-100 text-ink-500')}>
            {total}
          </span>
          <AnimatePresence>
            {pulso ? (
              <motion.span
                initial={{ opacity: 1, scale: 0.6, y: 0 }}
                animate={{ opacity: 0, scale: 1.4, y: -34 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
                className="pointer-events-none absolute left-1/2 top-0 text-lg"
                aria-hidden
              >
                🙏
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3.5 py-2.5 text-[13px] font-medium text-ink-600 transition-colors hover:border-gold-300 hover:bg-gold-50/50"
        >
          <MessageCircleHeart className="h-4 w-4" />
          <span className="tabular">{respostas.length}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', expandido && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expandido ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
          >
            <div className="mt-5 space-y-3">
              {respostas.length === 0 ? (
                <p className="rounded-2xl bg-ivory-100 p-4 text-center text-[13.5px] text-ink-400">
                  Ninguém respondeu ainda. Seja o primeiro a levar uma palavra de ânimo.
                </p>
              ) : (
                respostas.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-ivory-100 p-4">
                    <p className="text-[14px] leading-relaxed text-ink-700">{r.body}</p>
                    <p className="mt-2 text-[11.5px] text-ink-300">
                      {r.displayName ?? 'Um irmão em Cristo'} · {relativeTime(r.createdAt)}
                    </p>
                  </div>
                ))
              )}

              <div className="flex flex-wrap gap-1.5">
                {RESPOSTAS_RAPIDAS.slice(0, 3).map((r) => (
                  <button
                    key={r}
                    onClick={() => enviarResposta(r)}
                    disabled={enviando}
                    className="rounded-full border border-ink-200 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-gold-300 hover:bg-gold-50 disabled:opacity-50"
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviarResposta(texto);
                }}
                className="flex gap-2"
              >
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva uma palavra de fé…"
                  maxLength={400}
                  className="field !py-2.5 text-[14px]"
                  aria-label="Sua resposta"
                />
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  className="btn-primary !px-4 !py-2.5"
                  aria-label="Enviar resposta"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
