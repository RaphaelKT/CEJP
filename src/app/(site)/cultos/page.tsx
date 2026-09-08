import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus, MapPin } from 'lucide-react';
import { ServicesSection } from '@/components/home/ServicesSection';
import { Ornament } from '@/components/ui/Section';
import { lerCultos } from '@/lib/queries';
import { IGREJA } from '@/lib/site/config';

export const metadata: Metadata = {
  title: 'Programação de cultos',
  description:
    'Confira os horários de todos os cultos da Missão Evangélica do Brasil em Padre Miguel, Rio de Janeiro.',
};

export const dynamic = 'force-dynamic';

export default async function CultosPage() {
  const cultos = await lerCultos();

  return (
    <>
      <section className="relative overflow-hidden bg-ivory-veil pb-14 pt-[calc(var(--header-h)+64px)]">
        <div className="container relative text-center">
          <Ornament className="mb-7" />
          <p className="eyebrow mb-4">Programação semanal</p>
          <h1 className="mx-auto max-w-3xl text-display text-ink-900">
            Nossa <span className="text-gold-foil">semana</span> inteira
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-600">
            Todos os cultos acontecem no templo sede, em {IGREJA.endereco.bairro}. Não precisa avisar
            que vem — só chegue.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#mapa" className="btn-outline">
              <MapPin className="h-4 w-4" /> Como chegar
            </Link>
            <a href="/api/calendario/cultos.ics" download className="btn-primary">
              <CalendarPlus className="h-4 w-4" /> Adicionar ao meu calendário
            </a>
          </div>
        </div>
      </section>

      <ServicesSection cultos={cultos} />
    </>
  );
}
