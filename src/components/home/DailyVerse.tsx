'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, Share2, Copy, Check, Sunrise } from 'lucide-react';
import type { VersiculoDoDia } from '@/lib/content/verses';
import { msUntilNextMidnight } from '@/lib/utils/format';

/**
 * Espaço do versículo diário.
 *
 * A troca acontece exatamente às 00:00 (America/São_Paulo): calculamos o
 * tempo restante até a virada e agendamos um refetch — o visitante que
 * deixou a aba aberta a noite toda vê o versículo novo sem recarregar.
 */
export function DailyVerse({ inicial }: { inicial: VersiculoDoDia }) {
  const [verso, setVerso] = useState(inicial);
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState<string>('');

  useEffect(() => {
    let timerVirada: ReturnType<typeof setTimeout>;

    const agendarVirada = () => {
      timerVirada = setTimeout(async () => {
        try {
          const res = await fetch('/api/versiculo', { cache: 'no-store' });
          if (res.ok) setVerso((await res.json()) as VersiculoDoDia);
        } catch {
          /* mantém o versículo atual */
        }
        agendarVirada();
      }, msUntilNextMidnight() + 1500);
    };

    agendarVirada();
    return () => clearTimeout(timerVirada);
  }, []);

  useEffect(() => {
    const tick = () => {
      const ms = msUntilNextMidnight();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setRestante(`${h}h${String(m).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const textoCompleto = `"${verso.text}"\n— ${verso.reference} (${verso.version})`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  };

  const compartilhar = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Versículo do dia', text: textoCompleto });
        return;
      } catch {
        /* usuário cancelou */
      }
    }
    void copiar();
  };

  return (
    <section className="relative overflow-hidden bg-crimson-deep py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(241,220,156,.55), transparent 42%), radial-gradient(circle at 82% 78%, rgba(200,153,43,.4), transparent 46%)',
        }}
        aria-hidden
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden>
        <defs>
          <pattern id="cruzes" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M36 22v28M22 36h28" stroke="#F1DC9C" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cruzes)" />
      </svg>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-gold-300/30 bg-gold-300/10 px-4 py-1.5 text-2xs font-semibold uppercase tracking-[0.2em] text-gold-200 backdrop-blur-sm">
            <Sunrise className="h-3.5 w-3.5" />
            Palavra de hoje
            {verso.theme ? <span className="text-gold-300/60">· {verso.theme}</span> : null}
          </div>

          <Quote className="mx-auto mb-6 h-9 w-9 text-gold-300/45" />

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={verso.localDate + verso.reference}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-display text-[clamp(1.5rem,3.4vw,2.5rem)] font-normal leading-[1.28] text-ivory-50">
                “{verso.text}”
              </p>
              <footer className="mt-7">
                <cite className="not-italic">
                  <span className="text-gold-foil text-lg font-semibold tracking-wide">
                    {verso.reference}
                  </span>
                  <span className="ml-2 text-sm text-ivory-200/50">{verso.version}</span>
                </cite>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          {verso.reflection ? (
            <p className="mx-auto mt-8 max-w-xl text-[15.5px] leading-relaxed text-ivory-200/70">
              {verso.reflection}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={copiar} className="btn border border-ivory-50/20 text-ivory-100 hover:border-gold-300/60 hover:bg-ivory-50/5">
              {copiado ? <Check className="h-4 w-4 text-olive-400" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={compartilhar} className="btn border border-ivory-50/20 text-ivory-100 hover:border-gold-300/60 hover:bg-ivory-50/5">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </button>
          </div>

          <p className="mt-8 text-2xs uppercase tracking-[0.2em] text-ivory-200/35">
            Nova palavra em {restante}
          </p>
        </div>
      </div>
    </section>
  );
}
