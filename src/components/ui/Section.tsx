import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        'mb-12 flex flex-col gap-5 sm:mb-16',
        align === 'center' ? 'items-center text-center' : 'items-start',
        action && 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="eyebrow mb-3 flex items-center gap-2.5">
            <span className="inline-block h-px w-8 bg-gold-400" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-headline text-ink-900">{title}</h2>
        {description ? (
          <p className="mt-4 text-[17px] leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-500" fill="currentColor">
        <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
    </div>
  );
}
