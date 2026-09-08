import 'server-only';
import { createHash } from 'node:crypto';
import type { PrayerCategory, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { publish } from '@/lib/realtime/bus';
import { recalcularContadores } from '@/lib/stats';
import { moderarTexto, ACOLHIMENTO_CRISE } from '@/lib/moderation';

/** Identificador estável e anônimo do visitante (para curtir uma vez só). */
export function fingerprintDe(ip: string | null, userAgent: string | null, salt: string) {
  return createHash('sha256').update(`${salt}|${ip ?? ''}|${userAgent ?? ''}`).digest('hex').slice(0, 32);
}

export { CATEGORIAS, RESPOSTAS_RAPIDAS } from './prayer-ui';

const LIMITE_POR_HORA = 5;

export type CriarPedidoParams = {
  body: string;
  title?: string;
  category: PrayerCategory;
  anonymous: boolean;
  displayName?: string;
  urgent: boolean;
  authorId?: string | null;
  fingerprint: string;
};

export async function criarPedido(params: CriarPedidoParams) {
  const umaHoraAtras = new Date(Date.now() - 3_600_000);
  const recentes = await prisma.prayerRequest.count({
    where: { authorFingerprint: params.fingerprint, createdAt: { gte: umaHoraAtras } },
  });
  if (recentes >= LIMITE_POR_HORA) {
    return { ok: false as const, erro: 'Você já compartilhou vários pedidos na última hora. Descanse um pouco — estamos orando.' };
  }

  const moderacao = moderarTexto(params.body);
  if (moderacao.bloqueado) {
    return {
      ok: false as const,
      erro: `Não conseguimos publicar este texto (${moderacao.motivos.join(', ')}). O mural é um espaço de acolhimento — reescreva com suas palavras e tente de novo.`,
    };
  }

  const status = moderacao.precisaRevisao ? 'PENDENTE_MODERACAO' : 'PUBLICADO';

  const pedido = await prisma.prayerRequest.create({
    data: {
      authorId: params.anonymous ? null : (params.authorId ?? null),
      anonymous: params.anonymous,
      displayName: params.anonymous ? null : (params.displayName ?? null),
      category: params.category,
      title: params.title?.trim() || null,
      body: moderacao.textoSanitizado,
      status,
      urgent: params.urgent || moderacao.crise,
      authorFingerprint: params.fingerprint,
      toxicityScore: moderacao.score,
      autoFlagged: moderacao.precisaRevisao,
      moderationNote: moderacao.motivos.join('; ') || null,
      publishedAt: status === 'PUBLICADO' ? new Date() : null,
      expiresAt: new Date(Date.now() + 90 * 86_400_000),
    },
  });

  if (moderacao.precisaRevisao) {
    await prisma.moderationCase.create({
      data: {
        entityType: 'prayer_request',
        entityId: pedido.id,
        prayerRequestId: pedido.id,
        reason: moderacao.crise ? 'sinal_de_crise' : 'revisao_automatica',
        signals: { score: moderacao.score, motivos: moderacao.motivos } as Prisma.InputJsonValue,
        status: moderacao.crise ? 'ESCALADO' : 'ABERTO',
      },
    });
  }

  if (status === 'PUBLICADO') {
    publish('mural', { tipo: 'novo_pedido', id: pedido.publicId });
    await recalcularContadores(['pedidos_de_oracao']);
  }

  return {
    ok: true as const,
    pedido,
    emRevisao: moderacao.precisaRevisao,
    acolhimento: moderacao.crise ? ACOLHIMENTO_CRISE : null,
  };
}

export async function alternarOracao(requestId: string, fingerprint: string, userId?: string | null) {
  const existente = await prisma.prayerInteraction.findUnique({
    where: { requestId_fingerprint_kind: { requestId, fingerprint, kind: 'ESTOU_ORANDO' } },
  });

  if (existente) {
    const [, pedido] = await prisma.$transaction([
      prisma.prayerInteraction.delete({ where: { id: existente.id } }),
      prisma.prayerRequest.update({ where: { id: requestId }, data: { prayerCount: { decrement: 1 } } }),
    ]);
    publish('mural', { tipo: 'oracao', id: requestId, total: pedido.prayerCount });
    return { orando: false, total: pedido.prayerCount };
  }

  const [, pedido] = await prisma.$transaction([
    prisma.prayerInteraction.create({
      data: { requestId, fingerprint, userId: userId ?? undefined, kind: 'ESTOU_ORANDO' },
    }),
    prisma.prayerRequest.update({ where: { id: requestId }, data: { prayerCount: { increment: 1 } } }),
  ]);
  publish('mural', { tipo: 'oracao', id: requestId, total: pedido.prayerCount });
  await recalcularContadores(['oracoes_registradas']);
  return { orando: true, total: pedido.prayerCount };
}

export async function responderPedido(params: {
  requestId: string;
  body: string;
  anonymous: boolean;
  displayName?: string;
  authorId?: string | null;
  fingerprint: string;
}) {
  const moderacao = moderarTexto(params.body);
  if (moderacao.bloqueado) {
    return { ok: false as const, erro: 'Sua mensagem não pôde ser publicada. Escreva palavras de ânimo e fé.' };
  }

  const [resposta, pedido] = await prisma.$transaction([
    prisma.prayerReply.create({
      data: {
        requestId: params.requestId,
        authorId: params.anonymous ? null : (params.authorId ?? null),
        anonymous: params.anonymous,
        displayName: params.anonymous ? null : (params.displayName ?? null),
        body: moderacao.textoSanitizado,
        fingerprint: params.fingerprint,
        toxicityScore: moderacao.score,
        hidden: moderacao.precisaRevisao,
      },
    }),
    prisma.prayerRequest.update({ where: { id: params.requestId }, data: { replyCount: { increment: 1 } } }),
  ]);

  publish('mural', { tipo: 'resposta', id: params.requestId, total: pedido.replyCount });
  return { ok: true as const, resposta, emRevisao: moderacao.precisaRevisao };
}
