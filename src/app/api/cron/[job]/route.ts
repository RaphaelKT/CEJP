import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { safeEqual } from '@/lib/auth/crypto';
import { varreduraDiaria } from '@/lib/membership/engine';
import { recalcularContadores } from '@/lib/stats';
import { versiculoDoDia } from '@/lib/content/verses';
import { reconciliarPagamentos } from '@/lib/payments/reconciliacao';
import { materializarCultos } from '@/lib/jobs/cultos';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Rotinas agendadas.
 *
 * Protegidas por segredo compartilhado (header `x-cron-secret` ou
 * `Authorization: Bearer`), compatível com Vercel Cron, GitHub Actions ou
 * um `curl` no crontab do servidor.
 *
 *   0 0 * * *   /api/cron/versiculo        virada do versículo às 00:00
 *   5 0 * * *   /api/cron/membresia        avaliação de frequência
 *  15 0 * * 1   /api/cron/cultos           materializa a semana
 *   0 * * * *   /api/cron/reconciliacao    pagamentos pendentes
 *   a cada 15 min  /api/cron/contadores      contadores públicos
 */
const JOBS: Record<string, () => Promise<unknown>> = {
  versiculo: async () => {
    const verso = await versiculoDoDia();
    return { localDate: verso.localDate, reference: verso.reference };
  },
  membresia: () => varreduraDiaria(),
  contadores: () => recalcularContadores(),
  reconciliacao: () => reconciliarPagamentos(),
  cultos: () => materializarCultos(),
};

export async function POST(req: Request, ctx: { params: Promise<{ job: string }> }) {
  const { job } = await ctx.params;

  const enviado =
    req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!safeEqual(enviado, env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado.' }, { status: 401 });
  }

  const executor = JOBS[job];
  if (!executor) {
    return NextResponse.json({ ok: false, erro: `Job "${job}" não existe.`, disponiveis: Object.keys(JOBS) }, { status: 404 });
  }

  const execucao = await prisma.jobRun.create({ data: { jobKey: job } }).catch(() => null);
  const inicio = Date.now();

  try {
    const resultado = await executor();
    const duracao = Date.now() - inicio;

    if (execucao) {
      await prisma.jobRun.update({
        where: { id: execucao.id },
        data: { status: 'SUCCESS', finishedAt: new Date(), durationMs: duracao, result: resultado as never },
      });
    }

    return NextResponse.json({ ok: true, job, duracaoMs: duracao, resultado });
  } catch (error) {
    const mensagem = (error as Error).message;
    if (execucao) {
      await prisma.jobRun.update({
        where: { id: execucao.id },
        data: { status: 'FAILED', finishedAt: new Date(), durationMs: Date.now() - inicio, error: mensagem.slice(0, 900) },
      });
    }
    return NextResponse.json({ ok: false, job, erro: mensagem }, { status: 500 });
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ job: string }> }) {
  return POST(req, ctx);
}
