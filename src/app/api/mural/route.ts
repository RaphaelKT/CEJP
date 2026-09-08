import { NextResponse } from 'next/server';
import { erro, ipDe, ipHashDe, limitar, ok, respostaLimite, tratarErro } from '@/lib/api';
import { lerMural } from '@/lib/queries';
import { criarPedido, fingerprintDe } from '@/lib/prayer';
import { prayerRequestSchema } from '@/lib/validation';
import { getSessionUser } from '@/lib/auth/session';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fingerprint = fingerprintDe(ipDe(req), req.headers.get('user-agent'), env.HASH_PEPPER);

    const resultado = await lerMural({
      limite: Math.min(24, Number(url.searchParams.get('limite') ?? 12)),
      categoria: url.searchParams.get('categoria'),
      ordem: url.searchParams.get('ordem') ?? 'recentes',
      cursor: url.searchParams.get('cursor'),
      fingerprint,
    });

    return NextResponse.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return tratarErro(e);
  }
}

export async function POST(req: Request) {
  try {
    const limite = limitar(`mural:post:${ipHashDe(req)}`, 5, 3_600_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const corpo = prayerRequestSchema.parse(await req.json());
    const usuario = await getSessionUser().catch(() => null);
    const fingerprint = fingerprintDe(ipDe(req), req.headers.get('user-agent'), env.HASH_PEPPER);

    const resultado = await criarPedido({
      body: corpo.body,
      title: corpo.title,
      category: corpo.category,
      anonymous: corpo.anonymous || !usuario,
      displayName: usuario?.fullName,
      urgent: corpo.urgent,
      authorId: usuario?.id ?? null,
      fingerprint,
    });

    if (!resultado.ok) return erro(resultado.erro, 422);

    return ok({
      publicId: resultado.pedido.publicId,
      emRevisao: resultado.emRevisao,
      acolhimento: resultado.acolhimento,
    }, 201);
  } catch (e) {
    return tratarErro(e);
  }
}
