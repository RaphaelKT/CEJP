import { cn } from '@/lib/utils/cn';

/**
 * Brasão institucional — cruz sobre chama, dentro de um escudo.
 * Desenhado em SVG puro para permanecer nítido em qualquer densidade
 * e herdar as cores da paleta via `currentColor` e gradientes definidos.
 */
export function Logo({ className, monochrome = false }: { className?: string; monochrome?: boolean }) {
  const uid = monochrome ? 'mono' : 'cor';
  return (
    <svg viewBox="0 0 48 56" className={cn('h-10 w-auto', className)} aria-hidden fill="none">
      <defs>
        <linearGradient id={`foil-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1DC9C" />
          <stop offset="38%" stopColor="#D8AE41" />
          <stop offset="70%" stopColor="#C8992B" />
          <stop offset="100%" stopColor="#875E1A" />
        </linearGradient>
        <linearGradient id={`blood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4162A" />
          <stop offset="100%" stopColor="#6E0D1A" />
        </linearGradient>
      </defs>

      {/* Escudo */}
      <path
        d="M24 1.6 45.2 8.4v20.9c0 11.4-8.3 20.4-21.2 25.1C10.9 49.7 2.6 40.7 2.6 29.3V8.4L24 1.6Z"
        fill={monochrome ? 'currentColor' : `url(#foil-${uid})`}
        opacity={monochrome ? 0.18 : 1}
      />
      <path
        d="M24 5.1 41.8 10.8v18.5c0 9.6-7 17.3-17.8 21.4C13.2 46.6 6.2 38.9 6.2 29.3V10.8L24 5.1Z"
        fill={monochrome ? 'none' : '#FFFDF9'}
      />

      {/* Chama */}
      <path
        d="M24 15.5c3.6 3.2 5.6 6.3 5.6 9.6 0 3.6-2.5 6.2-5.6 6.2s-5.6-2.6-5.6-6.2c0-3.3 2-6.4 5.6-9.6Z"
        fill={monochrome ? 'currentColor' : `url(#blood-${uid})`}
        opacity={monochrome ? 0.55 : 0.16}
      />

      {/* Cruz */}
      <path
        d="M22.1 12.8h3.8v8.1h6.5v3.8h-6.5v18.6h-3.8V24.7h-6.5v-3.8h6.5v-8.1Z"
        fill={monochrome ? 'currentColor' : `url(#blood-${uid})`}
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
        Missão Evangélica
      </span>
      <span className="text-2xs font-semibold uppercase tracking-[0.3em] text-gold-600">do Brasil</span>
    </span>
  );
}
