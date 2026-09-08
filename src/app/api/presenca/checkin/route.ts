import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ipHashDe, limitar, respostaLimite, tratarErro, erro } from '@/lib/api';
import { registrarPresenca, validarTokenTotem } from '@/lib/membership/engine';
import { requireUser, requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

const schema = z.object({
  /** Código lido do QR do totem (`occurrenceId.janela.assinatura`). */
  tokenCode: z.string().optional(),
  occurrenceId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracyM: z.number().optional(),
  deviceHash: z.string().max(128).optional(),
  /** Registro feito pela recepção em nome de outra pessoa. */
  targetUserId: z.string().optional(),
  method: z
    .enum(['QR_ROTATIVO', 'QR_CARTEIRINHA', 'NFC', 'GEOFENCE_APP', 'MANUAL_SECRETARIA', 'CATRACA'])
    .default('QR_ROTATIVO'),
});

export async function POST(req: Request) {
  try {
    const limite = limitar(`checkin:${ipHashDe(req)}`, 60, 300_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const dados = schema.parse(await req.json());
    const usuario = await requireUser();

    // Registro em nome de terceiro exige permissão de recepção/secretaria.
    let alvoId = usuario.id;
    if (dados.targetUserId && dados.targetUserId !== usuario.id) {
      await requirePermission(PERMISSIONS.PRESENCA_REGISTRAR);
      alvoId = dados.targetUserId;
    }

    let occurrenceId = dados.occurrenceId;
    if (dados.tokenCode) {
      const validacao = validarTokenTotem(dados.tokenCode);
      if (!validacao.valido) return erro(validacao.motivo, 422);
      occurrenceId = validacao.occurrenceId;
    }
    if (!occurrenceId) return erro('Informe o culto ou escaneie o QR do totem.', 422);

    const resultado = await registrarPresenca({
      userId: alvoId,
      occurrenceId,
      method: dados.method,
      tokenCode: dados.tokenCode,
      latitude: dados.latitude,
      longitude: dados.longitude,
      accuracyM: dados.accuracyM,
      deviceHash: dados.deviceHash,
      ipHash: ipHashDe(req) ?? undefined,
      recordedById: alvoId !== usuario.id ? usuario.id : undefined,
    });

    return NextResponse.json(resultado, { status: resultado.ok ? 201 : 202 });
  } catch (e) {
    return tratarErro(e);
  }
}
