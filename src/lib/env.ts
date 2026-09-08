/**
 * Leitura tipada e tolerante das variaveis de ambiente.
 *
 * Regra de ouro: o site publico precisa subir mesmo sem credenciais de
 * gateway configuradas (modo SANDBOX), mas nunca deve subir em producao
 * com segredos padrao.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgresql://meb:meb@localhost:5432/meb?schema=public'),

  APP_URL: z.string().default('http://localhost:3000'),
  APP_NAME: z.string().default('Missão Evangélica do Brasil'),

  AUTH_SECRET: z.string().default('dev-only-secret-troque-em-producao-com-32-chars'),
  AUTH_ACCESS_TTL_MIN: z.coerce.number().default(20),
  AUTH_REFRESH_TTL_DAYS: z.coerce.number().default(30),
  HASH_PEPPER: z.string().default('dev-pepper'),

  PAYMENT_PROVIDER: z.enum(['MERCADO_PAGO', 'STRIPE', 'SANDBOX']).default('SANDBOX'),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  /// Geocerca padrão da sede (Estrada da Água Branca, 3570 — Padre Miguel/RJ)
  HQ_LATITUDE: z.coerce.number().default(-22.8735),
  HQ_LONGITUDE: z.coerce.number().default(-43.4426),
  HQ_GEOFENCE_RADIUS_M: z.coerce.number().default(400),

  MEDIA_STORAGE: z.enum(['local', 's3', 'r2']).default('local'),
  MEDIA_MAX_MB: z.coerce.number().default(25),

  CRON_SECRET: z.string().default('dev-cron-secret'),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('contato@missaoevangelicadobrasil.org.br'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[env] Variáveis inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida.');
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';

/**
 * Verificação de segredos.
 *
 * Roda apenas em produção *em execução* — nunca durante `next build`, que
 * também define NODE_ENV=production mas não tem acesso aos segredos do
 * ambiente de runtime (Vercel, Docker secrets, etc.).
 */
const emBuild = process.env.NEXT_PHASE === 'phase-production-build';

if (isProd && !emBuild) {
  const perigos: string[] = [];
  if (env.AUTH_SECRET.startsWith('dev-only')) perigos.push('AUTH_SECRET');
  if (env.HASH_PEPPER === 'dev-pepper') perigos.push('HASH_PEPPER');
  if (env.CRON_SECRET === 'dev-cron-secret') perigos.push('CRON_SECRET');
  if (perigos.length) {
    throw new Error(
      `Segredos padrão detectados em produção: ${perigos.join(', ')}. Defina valores próprios antes do deploy.`,
    );
  }
}
