/** Formatação pt-BR centralizada (dinheiro sempre em centavos). */

export function formatBRL(cents: number, opts: { compact?: boolean } = {}) {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

const DATE_TZ = 'America/Sao_Paulo';

export function formatDate(date: Date | string, style: 'curta' | 'longa' | 'mes' | 'completa' = 'curta') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Record<string, Intl.DateTimeFormatOptions> = {
    curta: { day: '2-digit', month: '2-digit', year: 'numeric' },
    longa: { day: 'numeric', month: 'long', year: 'numeric' },
    mes: { month: 'long', year: 'numeric' },
    completa: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  return new Intl.DateTimeFormat('pt-BR', { ...options[style], timeZone: DATE_TZ }).format(d);
}

export function formatDateRange(start: Date | string, end: Date | string) {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  const mesmoMes = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const dia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: DATE_TZ });
  const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: DATE_TZ });
  if (mesmoMes) return `${dia.format(s)} a ${dia.format(e)} de ${mesAno.format(e)}`;
  return `${formatDate(s, 'longa')} — ${formatDate(e, 'longa')}`;
}

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function weekdayName(index: number) {
  return WEEKDAYS[((index % 7) + 7) % 7];
}

/** Data local (YYYY-MM-DD) no fuso da igreja — base da virada do versículo às 00:00. */
export function localDateKey(date: Date = new Date(), timeZone = DATE_TZ) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Milissegundos até a próxima meia-noite no fuso informado. */
export function msUntilNextMidnight(timeZone = DATE_TZ, now: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const num = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const h = num('hour') % 24;
  const m = num('minute');
  const s = num('second');
  const decorridos = (h * 3600 + m * 60 + s) * 1000 + now.getMilliseconds();
  return 86_400_000 - decorridos;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁ-Ú]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export function relativeTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(-Math.round(diff / ms), unit);
  }
  return 'agora mesmo';
}
