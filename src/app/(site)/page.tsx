import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { LiveStats } from '@/components/home/LiveStats';
import { WelcomeSection } from '@/components/home/WelcomeSection';
import { DailyVerse } from '@/components/home/DailyVerse';
import { ServicesSection } from '@/components/home/ServicesSection';
import { EventsPreview } from '@/components/home/EventsPreview';
import { PrayerPreview } from '@/components/home/PrayerPreview';
import { LocationSection } from '@/components/home/LocationSection';
import { FinalCta } from '@/components/home/FinalCta';
import { lerContadoresPublicos } from '@/lib/stats';
import { versiculoDoDia } from '@/lib/content/verses';
import { lerSlides, lerCultos, lerEventosDestaque, lerMural, contarPedidos } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Missão Evangélica do Brasil — Uma casa de fé, acolhimento e propósito',
  description:
    'Cultos toda semana em Padre Miguel, Rio de Janeiro. Mural de orações, retiros, congressos e missões ao redor do mundo. Venha nos visitar.',
};

/**
 * A home lê de várias fontes (contadores, versículo do dia, mural, eventos)
 * e depende do horário local — por isso é renderizada dinamicamente, com
 * cada bloco degradando para conteúdo institucional se o banco não responder.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [contadores, versiculo, slides, cultos, eventos, mural, totalPedidos] = await Promise.all([
    lerContadoresPublicos(),
    versiculoDoDia(),
    lerSlides(),
    lerCultos(),
    lerEventosDestaque(3),
    lerMural({ limite: 4, ordem: 'mais_orados' }),
    contarPedidos(),
  ]);

  const cultosResumo = cultos
    .filter((c) => c.highlight || c.weekday === new Date().getDay())
    .slice(0, 4)
    .map((c) => ({ weekday: c.weekday, startTime: c.startTime, title: c.title, highlight: c.highlight }));

  return (
    <>
      <HeroCarousel slides={slides} cultos={cultosResumo.length ? cultosResumo : cultos.slice(0, 4).map((c) => ({ weekday: c.weekday, startTime: c.startTime, title: c.title, highlight: c.highlight }))} />
      <LiveStats iniciais={contadores} />
      <WelcomeSection />
      <DailyVerse inicial={versiculo} />
      <ServicesSection cultos={cultos} />
      <EventsPreview eventos={eventos} />
      <PrayerPreview pedidos={mural.pedidos} total={totalPedidos} />
      <LocationSection />
      <FinalCta />
    </>
  );
}
