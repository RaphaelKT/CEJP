import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/ui/Section';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { EventCard, type EventoResumo } from '@/components/eventos/EventCard';

export function EventsPreview({ eventos }: { eventos: EventoResumo[] }) {
  return (
    <section className="section relative overflow-hidden bg-ink-950">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: 'radial-gradient(circle,#C8992B,transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 h-[34rem] w-[34rem] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: 'radial-gradient(circle,#A31621,transparent 70%)' }}
        aria-hidden
      />

      <div className="container relative">
        <div className="mb-14 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2.5 text-2xs font-semibold uppercase tracking-[0.22em] text-gold-400">
              <span className="inline-block h-px w-8 bg-gold-500" aria-hidden />
              Agenda do ano
            </p>
            <h2 className="text-headline text-ivory-50">
              Os encontros que marcam <span className="text-gold-foil">a nossa história</span>
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-ivory-200/65">
              Retiros, congressos, acampamentos e viagens missionárias. Cada um com sua página, suas
              fotos das edições anteriores e inscrição em poucos toques.
            </p>
          </div>

          <Link
            href="/eventos"
            className="btn group shrink-0 border border-ivory-50/20 text-ivory-50 hover:border-gold-300/70 hover:bg-ivory-50/5"
          >
            Ver todos os eventos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <RevealGroup className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {eventos.map((evento, i) => (
            <RevealItem key={evento.editionSlug}>
              <EventCard evento={evento} prioridade={i === 0} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
