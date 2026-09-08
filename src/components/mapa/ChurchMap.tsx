'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { cn } from '@/lib/utils/cn';

type Props = {
  latitude: number;
  longitude: number;
  label: string;
  endereco: string;
  raioGeocercaM?: number;
  className?: string;
};

/**
 * Mapa interativo com OpenStreetMap.
 *
 * Carregado dinamicamente no cliente (Leaflet depende de `window`) e sem
 * chave de API — não há custo por carregamento nem risco de a chave vazar
 * no bundle. O círculo dourado representa a geocerca usada pelo sistema de
 * presença e pela validação de fotos da equipe de mídia.
 */
export function ChurchMap({ latitude, longitude, label, endereco, raioGeocercaM = 400, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelado || !containerRef.current || mapRef.current) return;

      const mapa = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20,
      }).addTo(mapa);

      L.control.zoom({ position: 'bottomright' }).addTo(mapa);

      // Geocerca institucional
      L.circle([latitude, longitude], {
        radius: raioGeocercaM,
        color: '#C8992B',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#D8AE41',
        fillOpacity: 0.1,
      }).addTo(mapa);

      // Marcador desenhado em SVG (mesma identidade do brasão)
      const icone = L.divIcon({
        className: 'meb-pin',
        html: `
          <div style="position:relative;width:46px;height:58px;">
            <div style="position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:22px;height:8px;background:rgba(23,19,16,.28);border-radius:50%;filter:blur(3px);"></div>
            <svg viewBox="0 0 46 58" width="46" height="58" style="position:absolute;inset:0;filter:drop-shadow(0 8px 16px rgba(163,22,33,.35));">
              <path d="M23 1C11.4 1 2 10.4 2 22c0 14.6 17.9 32 20.1 34.1a1.3 1.3 0 0 0 1.8 0C26.1 54 44 36.6 44 22 44 10.4 34.6 1 23 1Z" fill="#A31621"/>
              <path d="M23 4.2C13.2 4.2 5.2 12.2 5.2 22c0 12 14.1 27.2 17.8 30.9C26.7 49.2 40.8 34 40.8 22c0-9.8-8-17.8-17.8-17.8Z" fill="none" stroke="#F1DC9C" stroke-width="1.4" opacity=".55"/>
              <path d="M21.4 11h3.2v6.6h6.2v3.2h-6.2V34h-3.2V20.8h-6.2v-3.2h6.2V11Z" fill="#F1DC9C"/>
            </svg>
          </div>`,
        iconSize: [46, 58],
        iconAnchor: [23, 56],
        popupAnchor: [0, -50],
      });

      L.marker([latitude, longitude], { icon: icone, title: label, alt: label })
        .addTo(mapa)
        .bindPopup(
          `<div style="font-family:Inter,system-ui;min-width:200px">
             <strong style="display:block;font-size:14px;color:#171310;margin-bottom:4px">${label}</strong>
             <span style="font-size:12.5px;color:#5E534C;line-height:1.5">${endereco}</span>
           </div>`,
        );

      // Zoom por scroll só depois de um clique — evita "sequestrar" a rolagem.
      mapa.on('click', () => mapa.scrollWheelZoom.enable());
      mapa.on('mouseout', () => mapa.scrollWheelZoom.disable());

      mapRef.current = mapa;
      setPronto(true);
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label, endereco, raioGeocercaM]);

  return (
    <div className={cn('relative overflow-hidden rounded-[var(--radius-card)]', className)}>
      {/* CSS do Leaflet: importado por link para não bloquear o bundle da rota. */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`Mapa: ${label}`} />
      {!pronto ? (
        <div className="absolute inset-0 grid place-items-center bg-ivory-200">
          <div className="flex flex-col items-center gap-3 text-ink-400">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-300 border-t-gold-600" />
            <span className="text-[13px]">Carregando mapa…</span>
          </div>
        </div>
      ) : null}
      <style>{`
        .leaflet-container { font-family: var(--font-sans); background: #F8F1E3; }
        .leaflet-control-zoom a {
          border-radius: 10px !important; border: 1px solid #E8E5E2 !important;
          color: #332C28 !important; background: rgba(255,253,249,.94) !important;
        }
        .leaflet-control-zoom a:hover { background: #FDF8EA !important; color: #AB7B1F !important; }
        .leaflet-control-attribution { font-size: 10px; background: rgba(255,253,249,.8) !important; }
        .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 18px 44px -20px rgba(35,30,27,.35); }
        .leaflet-popup-tip { box-shadow: none; }
      `}</style>
    </div>
  );
}
