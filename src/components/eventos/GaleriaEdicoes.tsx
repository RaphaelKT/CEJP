'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type GaleriaAno = {
  ano: number;
  titulo: string;
  fotos: { url: string; legenda?: string }[];
};

export function GaleriaEdicoes({ galerias }: { galerias: GaleriaAno[] }) {
  const comFotos = galerias.filter((g) => g.fotos.length > 0);
  const [anoAtivo, setAnoAtivo] = useState(comFotos[0]?.ano ?? 0);
  const [aberta, setAberta] = useState<number | null>(null);

  const galeria = comFotos.find((g) => g.ano === anoAtivo) ?? comFotos[0];

  useEffect(() => {
    if (aberta === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null);
      if (e.key === 'ArrowRight') setAberta((i) => (i === null ? null : (i + 1) % (galeria?.fotos.length ?? 1)));
      if (e.key === 'ArrowLeft') setAberta((i) => (i === null ? null : (i - 1 + (galeria?.fotos.length ?? 1)) % (galeria?.fotos.length ?? 1)));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [aberta, galeria]);

  if (!galeria) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-ivory-100/60 p-14 text-center">
        <ImageOff className="mx-auto mb-4 h-9 w-9 text-ink-300" />
        <p className="font-display text-xl text-ink-900">As fotos estão a caminho</p>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-400">
          A equipe de mídia publica as imagens de cada edição pelo painel interno.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1">
        {comFotos.map((g) => (
          <button
            key={g.ano}
            onClick={() => setAnoAtivo(g.ano)}
            aria-pressed={anoAtivo === g.ano}
            className={cn(
              'shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-300',
              anoAtivo === g.ano
                ? 'bg-ink-900 text-ivory-50 shadow-soft'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-gold-300',
            )}
          >
            {g.ano}
            <span className="ml-2 text-[11.5px] opacity-60">{g.fotos.length}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {galeria.fotos.map((foto, i) => (
            <motion.button
              key={`${galeria.ano}-${foto.url}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setAberta(i)}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-ivory-200 shadow-soft transition-shadow duration-500 hover:shadow-lift',
                i % 7 === 0 ? 'aspect-[4/5] sm:row-span-2 sm:aspect-auto' : 'aspect-square',
              )}
            >
              <Image
                src={foto.url}
                alt={foto.legenda ?? `Foto da edição ${galeria.ano}`}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[1.1s] ease-expo group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {aberta !== null && galeria.fotos[aberta] ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-ink-950/95 p-4 backdrop-blur-sm"
            onClick={() => setAberta(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${aberta + 1} de ${galeria.fotos.length}`}
          >
            <button
              onClick={() => setAberta(null)}
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-ivory-50/20 text-ivory-50 transition-colors hover:border-gold-300"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setAberta((i) => (i! - 1 + galeria.fotos.length) % galeria.fotos.length); }}
              className="absolute left-3 grid h-12 w-12 place-items-center rounded-full border border-ivory-50/20 text-ivory-50 transition-colors hover:border-gold-300 sm:left-8"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <motion.div
              key={aberta}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative h-[78vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galeria.fotos[aberta]!.url}
                alt={galeria.fotos[aberta]!.legenda ?? ''}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); setAberta((i) => (i! + 1) % galeria.fotos.length); }}
              className="absolute right-3 grid h-12 w-12 place-items-center rounded-full border border-ivory-50/20 text-ivory-50 transition-colors hover:border-gold-300 sm:right-8"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <p className="absolute bottom-6 text-[13px] text-ivory-200/60">
              {galeria.titulo} · {aberta + 1} de {galeria.fotos.length}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
