/* eslint-disable no-console */
/**
 * Executor local das rotinas agendadas.
 *
 *   npm run jobs:daily            # todas as rotinas
 *   npm run jobs:daily membresia  # apenas uma
 *
 * Em produção, prefira chamar `/api/cron/<job>` com o header `x-cron-secret`
 * (Vercel Cron, GitHub Actions ou crontab do servidor).
 */
import { materializarCultos } from '../src/lib/jobs/cultos';
import { varreduraDiaria } from '../src/lib/membership/engine';
import { recalcularContadores } from '../src/lib/stats';
import { reconciliarPagamentos } from '../src/lib/payments/reconciliacao';
import { versiculoDoDia } from '../src/lib/content/verses';

const JOBS: Record<string, () => Promise<unknown>> = {
  cultos: () => materializarCultos(),
  membresia: () => varreduraDiaria(),
  contadores: () => recalcularContadores(),
  reconciliacao: () => reconciliarPagamentos(),
  versiculo: () => versiculoDoDia(),
};

async function main() {
  const alvo = process.argv[2];
  const chaves = alvo ? [alvo] : Object.keys(JOBS);

  for (const chave of chaves) {
    const executor = JOBS[chave];
    if (!executor) {
      console.error(`Job "${chave}" não existe. Disponíveis: ${Object.keys(JOBS).join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    const inicio = Date.now();
    try {
      const resultado = await executor();
      console.log(`✓ ${chave} (${Date.now() - inicio}ms)`, resultado ?? '');
    } catch (e) {
      console.error(`✗ ${chave}:`, (e as Error).message);
      process.exitCode = 1;
    }
  }
}

void main();
