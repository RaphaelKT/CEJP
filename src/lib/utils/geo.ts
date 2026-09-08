/**
 * Utilitários geoespaciais usados por dois subsistemas críticos:
 *  - validação de check-in (a pessoa estava mesmo no templo?)
 *  - validação das fotos da equipe de mídia (a foto foi tirada no local?)
 */

export type Coord = { latitude: number; longitude: number };

const R_EARTH_M = 6_371_008.8;

/** Distância em metros pela fórmula de Haversine. */
export function haversineMeters(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinGeofence(point: Coord, center: Coord, radiusM: number) {
  return haversineMeters(point, center) <= radiusM;
}

/** Converte EXIF DMS (graus/minutos/segundos) para graus decimais. */
export function dmsToDecimal(dms: number[] | number, ref?: string): number | null {
  if (typeof dms === 'number') {
    const sign = ref === 'S' || ref === 'W' ? -1 : 1;
    return dms * sign;
  }
  if (!Array.isArray(dms) || dms.length < 2) return null;
  const [d, m, s = 0] = dms;
  const decimal = Math.abs(d) + m / 60 + s / 3600;
  const sign = ref === 'S' || ref === 'W' ? -1 : 1;
  return decimal * sign;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/** Links de navegação para os apps mais usados no Brasil. */
export function navigationLinks(coord: Coord, label: string) {
  const q = encodeURIComponent(label);
  const { latitude: lat, longitude: lng } = coord;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`,
    googleSearch: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=&z=17&q=${q}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`,
    uber: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${q}`,
  };
}

/**
 * Geocodificação reversa via Nominatim (OpenStreetMap) — sem chave de API.
 * Usada como segundo sinal quando o EXIF traz coordenadas: confirmamos que
 * o CEP/bairro retornado bate com o local declarado no relatório da mídia.
 */
export async function reverseGeocode(coord: Coord, signal?: AbortSignal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coord.latitude}&lon=${coord.longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`;
  const res = await fetch(url, {
    signal,
    headers: { 'User-Agent': 'MissaoEvangelicaDoBrasil/1.0 (contato@missaoevangelicadobrasil.org.br)' },
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`Nominatim respondeu ${res.status}`);
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };
  return {
    displayName: data.display_name ?? null,
    postalCode: data.address?.postcode ?? null,
    suburb: data.address?.suburb ?? data.address?.neighbourhood ?? null,
    city: data.address?.city ?? data.address?.town ?? data.address?.municipality ?? null,
    state: data.address?.state ?? null,
    country: data.address?.country_code?.toUpperCase() ?? null,
  };
}

export function normalizePostalCode(cep?: string | null) {
  return (cep ?? '').replace(/\D/g, '').slice(0, 8);
}
