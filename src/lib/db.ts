import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Singleton do Prisma. Em dev o hot-reload do Next recria módulos a cada
 * alteração; sem o singleton isso estoura o pool de conexões do Postgres.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Executa uma consulta tolerando banco indisponível.
 * Usado nas páginas públicas: o site precisa renderizar (com dados de
 * demonstração) mesmo antes de o Postgres estar provisionado.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[db] consulta indisponível, usando fallback:', (error as Error).message);
    }
    return fallback;
  }
}
