import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { erro, ipDe, ipHashDe, limitar, respostaLimite, tratarErro } from '@/lib/api';
import { alternarOracao, fingerprintDe } from '@/lib/prayer';
import { getSessionUser } from '@/lib/auth/session';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Alterna o "Estou orando" — idempotente por (pedido, impressão digital). */
export async function POST(req: Request, ctx: { params: Promise<{ publicId: string }> }) {
  try {
    const limite = limitar(`orar:${ipHashDe(req)}`, 120, 60_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const { publicId } = await ctx.params;
    const pedido = await prisma.prayerRequest.findUnique({ where: { publicId }, select: { id: true, status: true } });
    if (!pedido || !['PUBLICADO', 'RESPONDIDO'].includes(pedido.status)) {
      return erro('Pedido não encontrado.', 404);
    }

    const usuario = await getSessionUser().catch(() => null);
    const fingerprint = fingerprintDe(ipDe(req), req.headers.get('user-agent'), env.HASH_PEPPER);
    const resultado = await alternarOracao(pedido.id, fingerprint, usuario?.id);

    return NextResponse.json(resultado);
  } catch (e) {
    return tratarErro(e);
  }
}
