import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { erro, tratarErro } from '@/lib/api';
import { gerarTokenTotem } from '@/lib/membership/engine';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * Token rotativo exibido no totem/telão da recepção.
 * Renovado a cada 60s pelo próprio painel — um print antigo não funciona.
 */
export async function GET(req: Request) {
  try {
    await requirePermission(PERMISSIONS.PRESENCA_REGISTRAR);

    const url = new URL(req.url);
    const occurrenceId = url.searchParams.get('culto');

    const ocorrencia = occurrenceId
      ? await prisma.serviceOccurrence.findUnique({ where: { id: occurrenceId } })
      : await prisma.serviceOccurrence.findFirst({
          where: {
            canceled: false,
            startsAt: { gte: new Date(Date.now() - 3 * 3_600_000), lte: new Date(Date.now() + 3 * 3_600_000) },
          },
          orderBy: { startsAt: 'asc' },
        });

    if (!ocorrencia) return erro('Nenhum culto acontecendo agora.', 404);

    const token = gerarTokenTotem(ocorrencia.id);

    return NextResponse.json(
      {
        culto: { id: ocorrencia.id, titulo: ocorrencia.title, inicio: ocorrencia.startsAt, presentes: ocorrencia.attendanceCount },
        ...token,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return tratarErro(e);
  }
}
