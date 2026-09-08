'use client';

import dynamic from 'next/dynamic';
import { Car, Bus, Train, Navigation, Copy, Check, Clock, Accessibility, Baby, ParkingCircle } from 'lucide-react';
import { useState } from 'react';
import { IGREJA } from '@/lib/site/config';
import { navigationLinks } from '@/lib/utils/geo';
import { SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

const ChurchMap = dynamic(() => import('@/components/mapa/ChurchMap').then((m) => m.ChurchMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ivory-200" />,
});

const COMODIDADES = [
  { Icon: ParkingCircle, label: 'Estacionamento gratuito', detalhe: '120 vagas + vagas preferenciais' },
  { Icon: Accessibility, label: 'Acessibilidade total', detalhe: 'Rampas, elevador e intérprete de Libras' },
  { Icon: Baby, label: 'Ministério infantil', detalhe: 'Sala com monitoria em todos os cultos' },
  { Icon: Clock, label: 'Recepção 30 min antes', detalhe: 'Equipe de acolhimento na porta' },
];

export function LocationSection() {
  const [copiado, setCopiado] = useState(false);
  const links = navigationLinks(IGREJA.coordenadas, `${IGREJA.nome} — ${IGREJA.endereco.completo}`);

  const copiarEndereco = async () => {
    try {
      await navigator.clipboard.writeText(IGREJA.endereco.completo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <section id="mapa" className="section bg-white scroll-mt-24">
      <div className="container">
        <SectionHeading
          eyebrow="Venha nos visitar"
          title={
            <>
              É mais perto do que você <span className="text-gold-foil">imagina</span>
            </>
          }
          description="Estamos em Padre Miguel, na Zona Oeste do Rio. Toque no mapa para abrir a rota no seu aplicativo preferido — e avise a recepção que é sua primeira vez: temos um presente para você."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="ring-foil h-[420px] overflow-hidden rounded-[var(--radius-card)] shadow-lift sm:h-[520px]">
              <ChurchMap
                latitude={IGREJA.coordenadas.latitude}
                longitude={IGREJA.coordenadas.longitude}
                label={IGREJA.nome}
                endereco={IGREJA.endereco.completo}
                raioGeocercaM={400}
                className="h-full"
              />
            </div>
          </Reveal>

          <Reveal delay={0.12} className="order-1 lg:order-2">
            <div className="flex h-full flex-col gap-6">
              <div className="card p-7">
                <p className="eyebrow mb-3">Endereço</p>
                <address className="not-italic font-display text-xl leading-snug text-ink-900">
                  {IGREJA.endereco.logradouro}
                  <br />
                  <span className="text-ink-500">
                    {IGREJA.endereco.bairro} · {IGREJA.endereco.cidade}/{IGREJA.endereco.estado}
                  </span>
                  <br />
                  <span className="text-[15px] text-ink-400">CEP {IGREJA.endereco.cep}</span>
                </address>

                <button
                  onClick={copiarEndereco}
                  className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-medium text-gold-700 transition-colors hover:text-gold-800"
                >
                  {copiado ? <Check className="h-4 w-4 text-olive-500" /> : <Copy className="h-4 w-4" />}
                  {copiado ? 'Endereço copiado' : 'Copiar endereço'}
                </button>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <a href={links.google} target="_blank" rel="noreferrer noopener" className="btn-primary !px-4 !py-2.5 text-[13px]">
                    <Navigation className="h-4 w-4" /> Google Maps
                  </a>
                  <a href={links.waze} target="_blank" rel="noreferrer noopener" className="btn-outline !px-4 !py-2.5 text-[13px]">
                    <Car className="h-4 w-4" /> Waze
                  </a>
                  <a href={links.apple} target="_blank" rel="noreferrer noopener" className="btn-outline !px-4 !py-2.5 text-[13px]">
                    <Navigation className="h-4 w-4" /> Apple Maps
                  </a>
                  <a href={links.uber} target="_blank" rel="noreferrer noopener" className="btn-outline !px-4 !py-2.5 text-[13px]">
                    <Car className="h-4 w-4" /> Uber
                  </a>
                </div>
              </div>

              <div className="card p-7">
                <p className="eyebrow mb-4">Como chegar</p>
                <ul className="space-y-4 text-[14.5px]">
                  <li className="flex gap-3.5">
                    <Train className="mt-0.5 h-[18px] w-[18px] shrink-0 text-crimson-600" />
                    <span className="text-ink-600">
                      <strong className="font-semibold text-ink-900">Trem:</strong> Estação Padre Miguel
                      (Ramal Santa Cruz) — 12 min a pé.
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <Bus className="mt-0.5 h-[18px] w-[18px] shrink-0 text-crimson-600" />
                    <span className="text-ink-600">
                      <strong className="font-semibold text-ink-900">Ônibus/BRT:</strong> Corredor
                      Transolímpica, estação Água Branca — 6 min a pé.
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <Car className="mt-0.5 h-[18px] w-[18px] shrink-0 text-crimson-600" />
                    <span className="text-ink-600">
                      <strong className="font-semibold text-ink-900">Carro:</strong> Acesso pela Av.
                      Brasil e pela Estrada do Mendanha. Estacionamento próprio.
                    </span>
                  </li>
                </ul>
              </div>

              <ul className="grid gap-2.5 sm:grid-cols-2">
                {COMODIDADES.map(({ Icon, label, detalhe }) => (
                  <li key={label} className="rounded-2xl border border-ink-100 bg-ivory-100/60 p-4">
                    <Icon className="mb-2 h-[18px] w-[18px] text-gold-600" />
                    <p className="text-[13.5px] font-semibold text-ink-900">{label}</p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink-400">{detalhe}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
