import type { Metadata } from 'next';
import { Ornament } from '@/components/ui/Section';
import { EventsExplorer } from '@/components/eventos/EventsExplorer';
import { lerEventos } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Eventos e retiros',
  description:
    'Retiro de Carnaval, JUMEB, congressos, acampamentos e viagens missionárias da Missão Evangélica do Brasil. Inscrições online com PIX, cartão ou boleto.',
};

export const dynamic = 'force-dynamic';

export default async function EventosPage() {
  const eventos = await lerEventos(24);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 pb-16 pt-[calc(var(--header-h)+72px)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 0%, rgba(200,153,43,.6), transparent 55%), radial-gradient(ellipse at 85% 60%, rgba(163,22,33,.5), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="container relative text-center">
          <Ornament className="mb-7" />
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.22em] text-gold-400">
            Agenda da igreja
          </p>
          <h1 className="mx-auto max-w-4xl text-display text-ivory-50">
            Os encontros que marcam <span className="text-gold-foil">a nossa história</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-ivory-200/70">
            Cada evento tem sua página, suas fotos das edições anteriores e inscrição em poucos
            toques — com PIX, cartão em até 6x ou boleto.
          </p>
        </div>
      </section>

      <section className="bg-ivory-50 py-16 sm:py-20">
        <div className="container">
          <EventsExplorer eventos={eventos} />
        </div>
      </section>
    </>
  );
}
