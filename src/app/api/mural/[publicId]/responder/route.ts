import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { erro, ipDe, ipHashDe, limitar, respostaLimite, tratarErro } from '@/lib/api';
import { fingerprintDe, responderPedido } from '@/lib/prayer';
import { getSessionUser } from '@/lib/auth/session';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const schema = z.object({
  body: z.string().trim().min(3, 'Escreva sua palavra de ânimo.').max(400),
  anonymous: z.boolean().default(true),
});

export async function POST(req: Request, ctx: { params: Promise<{ publicId: string }> }) {
  try {
    const limite = limitar(`responder:${ipHashDe(req)}`, 20, 600_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const { publicId } = await ctx.params;
    const corpo = schema.parse(await req.json());

    const pedido = await prisma.prayerRequest.findUnique({ where: { publicId }, select: { id: true, status: true } });
    if (!pedido || !['PUBLICADO', 'RESPONDIDO'].includes(pedido.status)) {
      return erro('Pedido não encontrado.', 404);
    }

    const usuario = await getSessionUser().catch(() => null);
    const resultado = await responderPedido({
      requestId: pedido.id,
      body: corpo.body,
      anonymous: corpo.anonymous || !usuario,
      displayName: usuario?.fullName,
      authorId: usuario?.id ?? null,
      fingerprint: fingerprintDe(ipDe(req), req.headers.get('user-agent'), env.HASH_PEPPER),
    });

    if (!resultado.ok) return erro(resultado.erro, 422);

    return NextResponse.json({
      ok: true,
      emRevisao: resultado.emRevisao,
      resposta: {
        id: resultado.resposta.id,
        body: resultado.resposta.body,
        createdAt: resultado.resposta.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
