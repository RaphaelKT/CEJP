import type { PaymentProvider } from '@prisma/client';
import { env } from '@/lib/env';
import { MercadoPagoGateway } from './mercadopago';
import { SandboxGateway } from './sandbox';
import { StripeGateway } from './stripe';
import type { PaymentGateway } from './types';

const cache = new Map<PaymentProvider, PaymentGateway>();

/**
 * Resolve o gateway ativo.
 *
 * A ausência de credenciais nunca derruba o checkout: caímos para o
 * SandboxGateway, que reproduz a mesma máquina de estados. Isso permite
 * demonstrar o produto e rodar QA end-to-end sem contas de produção.
 */
export function getGateway(preferred?: PaymentProvider): PaymentGateway {
  const alvo: PaymentProvider = preferred ?? (env.PAYMENT_PROVIDER as PaymentProvider);
  const cached = cache.get(alvo);
  if (cached) return cached;

  let gateway: PaymentGateway;
  try {
    switch (alvo) {
      case 'MERCADO_PAGO':
        gateway = new MercadoPagoGateway();
        break;
      case 'STRIPE':
        gateway = new StripeGateway();
        break;
      default:
        gateway = new SandboxGateway();
    }
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[pagamentos] ${alvo} indisponível — usando SANDBOX.`);
    gateway = new SandboxGateway();
  }

  cache.set(alvo, gateway);
  return gateway;
}

export function gatewayForWebhook(provider: string): PaymentGateway {
  const map: Record<string, PaymentProvider> = {
    'mercado-pago': 'MERCADO_PAGO',
    mercadopago: 'MERCADO_PAGO',
    stripe: 'STRIPE',
    sandbox: 'SANDBOX',
  };
  return getGateway(map[provider.toLowerCase()] ?? 'SANDBOX');
}
