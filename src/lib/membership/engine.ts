import 'server-only';
import { createHmac } from 'node:crypto';
import type { CheckInMethod, MembershipStage, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { haversineMeters } from '@/lib/utils/geo';
import { publish } from '@/lib/realtime/bus';
import { recalcularContadores } from '@/lib/stats';

/* ==================================================================== */
/*  1. CAPTAÇÃO DE PRESENÇA                                             */
/* ==================================================================== */

/**
 * Token rotativo do totem.
 *
 * O telão do templo exibe um QR que muda a cada 60s. O código é
 * `occurrenceId.janela.assinatura`, assinado com HMAC — não é possível
 * gerar um válido fora do servidor, e um print antigo expira sozinho.
 * Isso resolve o problema clássico do "QR fixo fotografado no grupo".
 */
const JANELA_SEGUNDOS = 60;
/** Aceitamos a janela atual e a anterior (tolerância de relógio/latência). */
const JANELAS_ACEITAS = 2;

export function gerarTokenTotem(occurrenceId: string, em = Date.now()) {
  const janela = Math.floor(em / 1000 / JANELA_SEGUNDOS);
  const assinatura = assinarJanela(occurrenceId, janela);
  return {
    code: `${occurrenceId}.${janela}.${assinatura}`,
    expiresAt: new Date((janela + 1) * JANELA_SEGUNDOS * 1000),
    secondsRemaining: JANELA_SEGUNDOS - Math.floor((em / 1000) % JANELA_SEGUNDOS),
  };
}

function assinarJanela(occurrenceId: string, janela: number) {
  return createHmac('sha256', env.AUTH_SECRET)
    .update(`checkin:${occurrenceId}:${janela}`)
    .digest('base64url')
    .slice(0, 16);
}

export function validarTokenTotem(code: string, em = Date.now()) {
  const [occurrenceId, janelaStr, assinatura] = code.split('.');
  if (!occurrenceId || !janelaStr || !assinatura) return { valido: false as const, motivo: 'Formato inválido' };
  const janela = Number(janelaStr);
  const atual = Math.floor(em / 1000 / JANELA_SEGUNDOS);
  if (!Number.isFinite(janela) || atual - janela >= JANELAS_ACEITAS || janela > atual) {
    return { valido: false as const, motivo: 'QR expirado — aponte novamente para o telão' };
  }
  if (assinarJanela(occurrenceId, janela) !== assinatura) {
    return { valido: false as const, motivo: 'QR inválido' };
  }
  return { valido: true as const, occurrenceId };
}

export type RegistroPresenca = {
  userId: string;
  occurrenceId: string;
  method: CheckInMethod;
  tokenCode?: string;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
  deviceHash?: string;
  ipHash?: string;
  recordedById?: string;
};

export type ResultadoPresenca = {
  ok: boolean;
  status: 'CONFIRMADO' | 'PENDENTE' | 'SUSPEITO' | 'DUPLICADO' | 'REJEITADO';
  trustScore: number;
  mensagem: string;
  sinais: Record<string, unknown>;
  promovido?: boolean;
};

/**
 * Registra a presença aplicando um score antifraude multi-sinal.
 *
 * Sinais avaliados (peso):
 *   token rotativo válido .......... 35
 *   dentro da geocerca ............. 30
 *   dentro da janela do culto ...... 20
 *   precisão de GPS aceitável ...... 10
 *   dispositivo já conhecido ........ 5
 *
 * ≥ 70 confirma automaticamente; 40–69 vira PENDENTE (recepção confirma);
 * < 40 é marcado como SUSPEITO e não conta para a regra de membresia.
 */
export async function registrarPresenca(entrada: RegistroPresenca): Promise<ResultadoPresenca> {
  const ocorrencia = await prisma.serviceOccurrence.findUnique({
    where: { id: entrada.occurrenceId },
    include: { venue: true },
  });
  if (!ocorrencia || ocorrencia.canceled) {
    return { ok: false, status: 'REJEITADO', trustScore: 0, mensagem: 'Culto não encontrado.', sinais: {} };
  }

  const jaExiste = await prisma.checkIn.findUnique({
    where: { userId_occurrenceId: { userId: entrada.userId, occurrenceId: entrada.occurrenceId } },
  });
  if (jaExiste) {
    return {
      ok: true,
      status: 'DUPLICADO',
      trustScore: jaExiste.trustScore,
      mensagem: 'Sua presença neste culto já estava registrada.',
      sinais: {},
    };
  }

  const sinais: Record<string, unknown> = {};
  let score = 0;

  // Sinal 1 — token rotativo
  const manual = entrada.method === 'MANUAL_SECRETARIA' || entrada.method === 'IMPORTACAO_PLANILHA';
  if (manual) {
    score += 35;
    sinais.token = 'registro_manual_autorizado';
  } else if (entrada.tokenCode) {
    const t = validarTokenTotem(entrada.tokenCode);
    if (t.valido && t.occurrenceId === entrada.occurrenceId) {
      score += 35;
      sinais.token = 'valido';
    } else {
      sinais.token = t.valido ? 'culto_divergente' : t.motivo;
    }
  } else {
    sinais.token = 'ausente';
  }

  // Sinal 2 — geocerca
  let distancia: number | null = null;
  const centro = ocorrencia.venue
    ? { latitude: ocorrencia.venue.latitude, longitude: ocorrencia.venue.longitude }
    : { latitude: env.HQ_LATITUDE, longitude: env.HQ_LONGITUDE };
  const raio = ocorrencia.venue?.geofenceRadiusM ?? env.HQ_GEOFENCE_RADIUS_M;

  if (entrada.latitude != null && entrada.longitude != null) {
    distancia = haversineMeters({ latitude: entrada.latitude, longitude: entrada.longitude }, centro);
    if (distancia <= raio) {
      score += 30;
      sinais.geocerca = 'dentro';
    } else if (distancia <= raio * 3) {
      score += 12;
      sinais.geocerca = 'proximo';
    } else {
      sinais.geocerca = 'fora';
    }
    sinais.distanciaM = Math.round(distancia);
  } else if (manual) {
    score += 30;
    sinais.geocerca = 'dispensada_registro_presencial';
  } else {
    sinais.geocerca = 'sem_localizacao';
  }

  // Sinal 3 — janela temporal do culto
  const agora = Date.now();
  const inicio = ocorrencia.startsAt.getTime() - ocorrencia.checkInWindowMin * 60_000;
  const fim = (ocorrencia.endsAt?.getTime() ?? ocorrencia.startsAt.getTime() + 2 * 3_600_000) + ocorrencia.checkInWindowMin * 60_000;
  if (agora >= inicio && agora <= fim) {
    score += 20;
    sinais.janela = 'dentro';
  } else {
    sinais.janela = agora < inicio ? 'antes_do_culto' : 'apos_o_culto';
  }

  // Sinal 4 — precisão do GPS
  if (entrada.accuracyM != null && entrada.accuracyM <= 100) {
    score += 10;
    sinais.precisao = 'boa';
  } else if (entrada.accuracyM != null) {
    sinais.precisao = 'baixa';
  }

  // Sinal 5 — dispositivo conhecido
  if (entrada.deviceHash) {
    const conhecido = await prisma.checkIn.count({
      where: { userId: entrada.userId, deviceHash: entrada.deviceHash },
    });
    if (conhecido > 0) {
      score += 5;
      sinais.dispositivo = 'conhecido';
    } else {
      sinais.dispositivo = 'novo';
    }
  }

  const status = score >= 70 ? 'CONFIRMADO' : score >= 40 ? 'PENDENTE' : 'SUSPEITO';

  await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        userId: entrada.userId,
        occurrenceId: entrada.occurrenceId,
        method: entrada.method,
        status,
        latitude: entrada.latitude,
        longitude: entrada.longitude,
        accuracyM: entrada.accuracyM,
        distanceM: distancia,
        deviceHash: entrada.deviceHash,
        ipHash: entrada.ipHash,
        trustScore: score,
        trustSignals: sinais as Prisma.InputJsonValue,
        recordedById: entrada.recordedById,
      },
    }),
    prisma.serviceOccurrence.update({
      where: { id: entrada.occurrenceId },
      data: { attendanceCount: { increment: status === 'CONFIRMADO' ? 1 : 0 } },
    }),
    prisma.membershipEvent.create({
      data: {
        userId: entrada.userId,
        type: 'PRESENCA_REGISTRADA',
        evidence: { occurrenceId: entrada.occurrenceId, score, sinais } as Prisma.InputJsonValue,
      },
    }),
  ]);

  let promovido = false;
  if (status === 'CONFIRMADO') {
    const avaliacao = await avaliarMembresia(entrada.userId);
    promovido = avaliacao.mudou;
    await recalcularContadores(['presencas_no_mes', 'membros']);
  }

  const mensagens: Record<'CONFIRMADO' | 'PENDENTE' | 'SUSPEITO', string> = {
    CONFIRMADO: 'Presença confirmada. Que bênção ter você conosco!',
    PENDENTE: 'Presença registrada e enviada para conferência da recepção.',
    SUSPEITO: 'Não conseguimos confirmar sua presença. Procure a recepção para validar.',
  };

  return { ok: status !== 'SUSPEITO', status, trustScore: score, mensagem: mensagens[status], sinais, promovido };
}

/* ==================================================================== */
/*  2. MOTOR DE PROMOÇÃO A MEMBRO                                       */
/* ==================================================================== */

export type AvaliacaoMembresia = {
  userId: string;
  presencasValidas: number;
  minimo: number;
  janelaDias: number;
  estagioAtual: MembershipStage;
  estagioProposto: MembershipStage;
  mudou: boolean;
  exigeAprovacao: boolean;
};

async function regraAtiva() {
  const existente = await prisma.membershipRule.findUnique({ where: { key: 'default' } });
  return (
    existente ?? {
      id: 'default',
      key: 'default',
      minAttendance: 5,
      windowDays: 30,
      requiresPastoralReview: true,
      minTrustScore: 70,
      inactivityDays: 120,
      active: true,
      updatedAt: new Date(),
    }
  );
}

/**
 * Avalia um usuário contra a regra vigente.
 *
 * A janela é *deslizante* (últimos N dias) e não o mês-calendário: quem vem
 * dia 28, 29, 30, 1 e 2 é reconhecido — o que o corte mensal ignoraria.
 */
export async function avaliarMembresia(userId: string): Promise<AvaliacaoMembresia> {
  const regra = await regraAtiva();
  const desde = new Date(Date.now() - regra.windowDays * 86_400_000);

  const [usuario, presencas] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, membershipStage: true, fullName: true, membershipNumber: true },
    }),
    prisma.checkIn.count({
      where: {
        userId,
        status: 'CONFIRMADO',
        trustScore: { gte: regra.minTrustScore },
        checkedInAt: { gte: desde },
        occurrence: { canceled: false },
      },
    }),
  ]);

  let proposto: MembershipStage = usuario.membershipStage;
  if (usuario.membershipStage === 'VISITANTE' || usuario.membershipStage === 'FREQUENTADOR') {
    if (presencas >= regra.minAttendance) {
      proposto = regra.requiresPastoralReview ? 'EM_AVALIACAO' : 'MEMBRO';
    } else if (presencas >= 2) {
      proposto = 'FREQUENTADOR';
    }
  }

  const mudou = proposto !== usuario.membershipStage;
  if (mudou) {
    await aplicarTransicao(userId, usuario.membershipStage, proposto, {
      presencas,
      janelaDias: regra.windowDays,
      minimo: regra.minAttendance,
    });
  }

  return {
    userId,
    presencasValidas: presencas,
    minimo: regra.minAttendance,
    janelaDias: regra.windowDays,
    estagioAtual: usuario.membershipStage,
    estagioProposto: proposto,
    mudou,
    exigeAprovacao: regra.requiresPastoralReview,
  };
}

async function aplicarTransicao(
  userId: string,
  de: MembershipStage,
  para: MembershipStage,
  evidencia: Record<string, unknown>,
  actorId?: string,
) {
  const virouMembro = para === 'MEMBRO';
  const matricula = virouMembro ? await gerarMatricula() : undefined;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        membershipStage: para,
        ...(virouMembro
          ? { membershipSince: new Date(), membershipNumber: matricula, roles: { push: 'MEMBRO' } }
          : {}),
      },
    }),
    prisma.membershipEvent.create({
      data: {
        userId,
        type:
          para === 'EM_AVALIACAO'
            ? 'GATILHO_ATINGIDO'
            : para === 'MEMBRO'
              ? 'PROMOVIDO_A_MEMBRO'
              : 'AJUSTE_MANUAL',
        fromStage: de,
        toStage: para,
        period: new Date().toISOString().slice(0, 7),
        evidence: evidencia as Prisma.InputJsonValue,
        actorId,
        automatic: !actorId,
      },
    }),
  ]);

  if (para === 'EM_AVALIACAO') {
    await notificarPastoral(userId, evidencia);
  }

  if (virouMembro) {
    await prisma.notification.create({
      data: {
        userId,
        template: 'membresia.aprovada',
        title: 'Bem-vindo à família! 🎉',
        body: `Sua membresia foi confirmada. Sua matrícula é ${matricula}.`,
        href: '/painel/minha-conta',
      },
    });
    publish('membresia', { userId, estagio: para });
    await recalcularContadores(['membros']);
  }
}

async function gerarMatricula() {
  const ano = new Date().getFullYear();
  const total = await prisma.user.count({ where: { membershipNumber: { startsWith: `MEB-${ano}` } } });
  return `MEB-${ano}-${String(total + 1).padStart(5, '0')}`;
}

async function notificarPastoral(userId: string, evidencia: Record<string, unknown>) {
  const usuario = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  const responsaveis = await prisma.user.findMany({
    where: { roles: { hasSome: ['PASTOR', 'SECRETARIA'] }, status: 'ATIVO' },
    select: { id: true },
  });
  if (!responsaveis.length) return;
  await prisma.notification.createMany({
    data: responsaveis.map((r) => ({
      userId: r.id,
      template: 'membresia.gatilho',
      title: 'Nova membresia para confirmar',
      body: `${usuario?.fullName ?? 'Um frequentador'} atingiu ${evidencia.presencas} presenças em ${evidencia.janelaDias} dias.`,
      href: '/painel/membresia',
    })),
  });
}

/** Confirmação humana (secretaria/pastoral) — fecha o ciclo do gatilho. */
export async function confirmarMembresia(userId: string, actorId: string, aprovar: boolean, nota?: string) {
  const usuario = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (usuario.membershipStage !== 'EM_AVALIACAO') {
    throw new Error('Este cadastro não está aguardando confirmação.');
  }
  if (aprovar) {
    await aplicarTransicao(userId, 'EM_AVALIACAO', 'MEMBRO', { confirmadoPor: actorId, nota }, actorId);
  } else {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { membershipStage: 'FREQUENTADOR' } }),
      prisma.membershipEvent.create({
        data: {
          userId,
          type: 'REVERTIDO',
          fromStage: 'EM_AVALIACAO',
          toStage: 'FREQUENTADOR',
          actorId,
          automatic: false,
          note: nota,
        },
      }),
    ]);
  }
  await recalcularContadores(['membros']);
}

/**
 * Varredura diária: reavalia frequentadores e inativa membros ausentes.
 * Executada pelo job `/api/cron/membresia`.
 */
export async function varreduraDiaria() {
  const regra = await regraAtiva();
  const desde = new Date(Date.now() - regra.windowDays * 86_400_000);

  const candidatos = await prisma.user.findMany({
    where: {
      deletedAt: null,
      membershipStage: { in: ['VISITANTE', 'FREQUENTADOR'] },
      checkIns: { some: { status: 'CONFIRMADO', checkedInAt: { gte: desde } } },
    },
    select: { id: true },
    take: 5000,
  });

  const avaliacoes = [];
  for (const c of candidatos) avaliacoes.push(await avaliarMembresia(c.id));

  const limiteInatividade = new Date(Date.now() - regra.inactivityDays * 86_400_000);

  // Regra de inatividade — dois cuidados deliberados:
  //  1. `membershipSince` anterior ao limite: quem acabou de virar membro
  //     não é inativado no dia seguinte;
  //  2. exige ao menos uma presença registrada em algum momento. Membros
  //     antigos, migrados de uma ficha de papel, não podem ser inativados
  //     apenas porque a igreja ainda não usava check-in digital.
  const inativados = await prisma.user.findMany({
    where: {
      membershipStage: 'MEMBRO',
      deletedAt: null,
      membershipSince: { lt: limiteInatividade },
      checkIns: { some: { status: 'CONFIRMADO' } },
      NOT: { checkIns: { some: { status: 'CONFIRMADO', checkedInAt: { gte: limiteInatividade } } } },
    },
    select: { id: true },
    take: 5000,
  });

  for (const u of inativados) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: u.id }, data: { membershipStage: 'MEMBRO_INATIVO' } }),
      prisma.membershipEvent.create({
        data: { userId: u.id, type: 'INATIVADO', fromStage: 'MEMBRO', toStage: 'MEMBRO_INATIVO' },
      }),
    ]);
  }

  await recalcularContadores(['membros', 'presencas_no_mes']);

  return {
    avaliados: avaliacoes.length,
    promovidos: avaliacoes.filter((a) => a.mudou && a.estagioProposto !== 'FREQUENTADOR').length,
    inativados: inativados.length,
  };
}
