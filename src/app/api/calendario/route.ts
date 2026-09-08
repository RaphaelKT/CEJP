import { lerCultos } from '@/lib/queries';
import { IGREJA } from '@/lib/site/config';

export const dynamic = 'force-dynamic';

/**
 * Exporta a grade semanal como iCalendar (RFC 5545) com recorrência semanal.
 * Funciona em Google Agenda, Apple Calendar e Outlook sem integração extra.
 */
export async function GET() {
  const cultos = await lerCultos();
  const DIAS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const agora = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');

  const eventos = cultos.map((culto, i) => {
    const [h, m] = culto.startTime.split(':').map(Number);
    // Próxima ocorrência do dia da semana escolhido.
    const base = new Date();
    base.setHours(h ?? 0, m ?? 0, 0, 0);
    const delta = (culto.weekday - base.getDay() + 7) % 7;
    base.setDate(base.getDate() + delta);

    const inicio = base.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const fim = new Date(base.getTime() + 90 * 60_000).toISOString().replace(/[-:]|\.\d{3}/g, '');

    return [
      'BEGIN:VEVENT',
      `UID:meb-culto-${i}-${culto.weekday}@missaoevangelicadobrasil.org.br`,
      `DTSTAMP:${agora}`,
      `DTSTART:${inicio}`,
      `DTEND:${fim}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DIAS[culto.weekday]}`,
      `SUMMARY:${escapar(culto.title)}`,
      `DESCRIPTION:${escapar(culto.description ?? culto.audience ?? IGREJA.lema)}`,
      `LOCATION:${escapar(IGREJA.endereco.completo)}`,
      `GEO:${IGREJA.coordenadas.latitude};${IGREJA.coordenadas.longitude}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapar(culto.title)} começa em 1 hora`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Missao Evangelica do Brasil//Agenda de Cultos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${IGREJA.nome} — Cultos`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    ...eventos,
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cultos-meb.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapar(texto: string) {
  return texto.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}
