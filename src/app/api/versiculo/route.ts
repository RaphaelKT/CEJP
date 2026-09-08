import { NextResponse } from 'next/server';
import { versiculoDoDia } from '@/lib/content/verses';
import { msUntilNextMidnight } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

/**
 * Versículo do dia.
 * O `Cache-Control` expira exatamente na virada da meia-noite em
 * America/São_Paulo — a borda nunca serve o versículo de ontem.
 */
export async function GET() {
  const verso = await versiculoDoDia();
  const segundosAteVirada = Math.max(60, Math.floor(msUntilNextMidnight() / 1000));

  return NextResponse.json(verso, {
    headers: {
      'Cache-Control': `public, max-age=60, s-maxage=${segundosAteVirada}, stale-while-revalidate=300`,
    },
  });
}
