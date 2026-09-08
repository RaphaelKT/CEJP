'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { WEEKDAYS_SHORT } from '@/lib/utils/format';

export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export type CultoResumo = {
  weekday: number;
  startTime: string;
  title: string;
  highlight: boolean;
};

const DURACAO = 7000;

export function HeroCarousel({ slides, cultos }: { slides: Slide[]; cultos: CultoResumo[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, duration: 32, align: 'start' }, [
    Autoplay({ delay: DURACAO, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [indice, setIndice] = useState(0);
  const [tocando, setTocando] = useState(true);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndice(embla.selectedScrollSnap());
    onSelect();
    embla.on('select', onSelect).on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect);
    };
  }, [embla]);

  const alternarAutoplay = useCallback(() => {
    const autoplay = embla?.plugins()?.autoplay;
    if (!autoplay) return;
    if (tocando) autoplay.stop();
    else autoplay.play();
    setTocando((v) => !v);
  }, [embla, tocando]);

  const slideAtual = slides[indice] ?? slides[0];

  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink-950">
      {/* --- Trilho de imagens --- */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide, i) => (
            <div key={slide.id} className="relative h-full min-w-0 flex-[0_0_100%]">
              <motion.div
                className="absolute inset-0"
                animate={{ scale: indice === i ? 1.08 : 1 }}
                transition={{ duration: DURACAO / 1000 + 1.5, ease: 'linear' }}
              >
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/25" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/25 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* --- Conteúdo --- */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="container flex flex-1 items-center pt-[var(--header-h)]">
          <div className="max-w-2xl pb-32 sm:pb-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideAtual?.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {slideAtual?.badge ? (
                  <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-gold-200 backdrop-blur-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold-300" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
                    </span>
                    {slideAtual.badge}
                  </span>
                ) : null}

                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-crimson-300">
                  {slideAtual?.eyebrow}
                </p>

                <h1 className="text-display text-ivory-50 text-shadow-hero">{slideAtual?.title}</h1>

                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ivory-200/85 sm:text-lg">
                  {slideAtual?.subtitle}
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  {slideAtual?.ctaHref ? (
                    <Link href={slideAtual.ctaHref} className="btn-gold group">
                      {slideAtual.ctaLabel}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  ) : null}
                  {slideAtual?.secondaryHref ? (
                    <Link
                      href={slideAtual.secondaryHref}
                      className="btn border border-ivory-50/25 text-ivory-50 backdrop-blur-sm hover:border-gold-300/70 hover:bg-ivory-50/5"
                    >
                      {slideAtual.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* --- Faixa inferior: horários + controles --- */}
        <div className="relative border-t border-ivory-50/10 bg-ink-950/45 backdrop-blur-md">
          <div className="container flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <span className="hidden shrink-0 items-center gap-2 text-2xs font-semibold uppercase tracking-[0.2em] text-gold-300 sm:flex">
                <MapPin className="h-3.5 w-3.5" />
                Nossa semana
              </span>
              <ul className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto">
                {cultos.map((c, i) => (
                  <li key={`${c.weekday}-${c.startTime}-${i}`}>
                    <div
                      className={cn(
                        'flex shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2 text-[13px] transition-colors',
                        c.highlight
                          ? 'border-gold-400/50 bg-gold-400/10 text-gold-100'
                          : 'border-ivory-50/15 text-ivory-200/75',
                      )}
                    >
                      <span className="font-semibold uppercase tracking-wider text-crimson-300">
                        {WEEKDAYS_SHORT[c.weekday]}
                      </span>
                      <span className="tabular font-semibold">{c.startTime}</span>
                      <span className="whitespace-nowrap opacity-75">{c.title}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => embla?.scrollTo(i)}
                    aria-label={`Ir para o slide ${i + 1}: ${s.title}`}
                    aria-current={i === indice}
                    className="group relative h-1 overflow-hidden rounded-full bg-ivory-50/20 transition-all duration-500"
                    style={{ width: i === indice ? 44 : 16 }}
                  >
                    {i === indice ? (
                      <motion.span
                        key={`${s.id}-barra-${tocando}`}
                        className="absolute inset-y-0 left-0 rounded-full bg-gold-sheen"
                        initial={{ width: '0%' }}
                        animate={{ width: tocando ? '100%' : '35%' }}
                        transition={{ duration: tocando ? DURACAO / 1000 : 0.3, ease: 'linear' }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={alternarAutoplay} className="grid h-9 w-9 place-items-center rounded-full border border-ivory-50/15 text-ivory-100 transition-colors hover:border-gold-300/60" aria-label={tocando ? 'Pausar' : 'Reproduzir'}>
                  {tocando ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => embla?.scrollPrev()} className="grid h-9 w-9 place-items-center rounded-full border border-ivory-50/15 text-ivory-100 transition-colors hover:border-gold-300/60" aria-label="Slide anterior">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => embla?.scrollNext()} className="grid h-9 w-9 place-items-center rounded-full border border-ivory-50/15 text-ivory-100 transition-colors hover:border-gold-300/60" aria-label="Próximo slide">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
