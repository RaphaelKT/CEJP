import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, BookOpenText, Globe2, Sparkles } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { GALERIA_DEMO } from '@/lib/site/media-demo';
import { IGREJA } from '@/lib/site/config';

const PILARES = [
  {
    Icon: BookOpenText,
    titulo: 'Palavra que ensina',
    texto:
      'Pregação expositiva e discipulado sistemático. Aqui você não é só ouvinte — é formado para viver o que ouve.',
  },
  {
    Icon: HeartHandshake,
    titulo: 'Comunidade que sustenta',
    texto:
      'Células nos bairros, ministérios por faixa etária e um mural de orações onde ninguém carrega o peso sozinho.',
  },
  {
    Icon: Globe2,
    titulo: 'Missão que envia',
    texto:
      'Campos missionários em seis países e ações sociais permanentes na Zona Oeste do Rio de Janeiro.',
  },
];

export function WelcomeSection() {
  const anos = new Date().getFullYear() - IGREJA.fundacao;

  return (
    <section className="section relative overflow-hidden bg-white">
      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-2.5">
              <span className="inline-block h-px w-8 bg-gold-400" aria-hidden />
              Desde {IGREJA.fundacao}
            </p>

            <h2 className="text-headline text-ink-900">
              Uma igreja que começou numa <span className="text-gold-foil">garagem</span> e nunca
              esqueceu de onde veio
            </h2>

            <div className="mt-7 space-y-5 text-[16.5px] leading-relaxed text-ink-600">
              <p>
                Em {IGREJA.fundacao}, doze pessoas se reuniram numa garagem em Padre Miguel com uma
                Bíblia, um violão desafinado e a convicção de que o bairro precisava ouvir sobre
                Jesus.
              </p>
              <p>
                {anos} anos depois, somos uma igreja com congregações espalhadas pelo Rio e
                missionários em seis países — mas o corredor continua sendo o lugar onde a gente
                pergunta pelo nome do seu filho e lembra da sua cirurgia na semana seguinte.
              </p>
            </div>

            <Link href="/sobre" className="btn-primary group mt-9">
              Conheça nossa história
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="ring-foil relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] shadow-lift">
                    <Image src={GALERIA_DEMO[0]!} alt="Culto de celebração na Missão Evangélica do Brasil" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] shadow-soft">
                    <Image src={GALERIA_DEMO[2]!} alt="Momento de louvor" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
                  </div>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] shadow-soft">
                    <Image src={GALERIA_DEMO[1]!} alt="Comunhão entre membros" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
                  </div>
                  <div className="ring-foil relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] shadow-lift">
                    <Image src={GALERIA_DEMO[3]!} alt="Ação social do ministério" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-gold-200 bg-white/95 p-5 shadow-lift backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-gold-600" />
                  <div>
                    <p className="tabular font-display text-2xl font-semibold leading-none text-ink-900">
                      {anos} anos
                    </p>
                    <p className="mt-1 text-[12.5px] uppercase tracking-wider text-ink-400">
                      servindo o Rio de Janeiro
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <RevealGroup className="mt-24 grid gap-5 md:grid-cols-3">
          {PILARES.map(({ Icon, titulo, texto }) => (
            <RevealItem key={titulo}>
              <article className="card card-hover group h-full p-8">
                <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-crimson-deep text-ivory-50 shadow-crimson transition-transform duration-500 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl text-ink-900">{titulo}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{texto}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
