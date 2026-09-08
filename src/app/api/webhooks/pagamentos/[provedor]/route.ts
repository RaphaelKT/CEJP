import { NextResponse } from 'next/server';
import type { PaymentProvider } from '@prisma/client';
import { prisma } from '@/lib/db';
import { gatewayForWebhook } from '@/lib/payments/gateway';
import { aplicarResultado } from '@/lib/payments/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Recebimento de notificações dos provedores de pagamento.
 *
 * Contrato defensivo, na ordem:
 *  1. Assinatura HMAC verificada antes de qualquer leitura de negócio;
 *  2. Persistência do evento cru com chave única (provedor + id externo) —
 *     reentrega não reprocessa;
 *  3. Sempre respondemos 200 quando o evento foi *recebido*, para o provedor
 *     não entrar em loop de reenvio; falhas ficam registradas em
 *     `processingError` e são tratadas pelo job de reconciliação.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await ctx.params;
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const gateway = gatewayForWebhook(provedor);
  const verificacao = gateway.verifyWebhook(rawBody, headers);

  if (!verificacao.valid) {
    // Registramos a tentativa inválida — sinal de configuração errada ou ataque.
    await prisma.webhookEvent
      .create({
        data: {
          provider: gateway.provider as PaymentProvider,
          externalId: `invalido:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          eventType: verificacao.eventType,
          signatureValid: false,
          payload: safeJson(rawBody),
          headers: { 'user-agent': headers['user-agent'] ?? '' },
          processingError: verificacao.reason ?? 'Assinatura inválida',
        },
      })
      .catch(() => null);
    return NextResponse.json({ recebido: false, motivo: 'assinatura_invalida' }, { status: 401 });
  }

  // Idempotência: se já registramos este evento, não reprocessa.
  const existente = await prisma.webhookEvent.findUnique({
    where: { provider_externalId: { provider: gateway.provider as PaymentProvider, externalId: verificacao.externalId } },
  });
  if (existente?.processedAt) {
    return NextResponse.json({ recebido: true, duplicado: true });
  }

  const evento =
    existente ??
    (await prisma.webhookEvent.create({
      data: {
        provider: gateway.provider as PaymentProvider,
        externalId: verificacao.externalId,
        eventType: verificacao.eventType,
        signatureValid: true,
        payload: safeJson(rawBody),
      },
    }));

  try {
    if (verificacao.providerPaymentId) {
      const atual = await gateway.fetchPayment(verificacao.providerPaymentId);
      if (atual) {
        const pagamento = await prisma.payment.findFirst({
          where: { providerPaymentId: verificacao.providerPaymentId },
          select: { id: true },
        });
        if (pagamento) await aplicarResultado(pagamento.id, atual, 'webhook');
      }
    }

    await prisma.webhookEvent.update({
      where: { id: evento.id },
      data: { processedAt: new Date(), attempts: { increment: 1 }, processingError: null },
    });
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: evento.id },
      data: { attempts: { increment: 1 }, processingError: (error as Error).message.slice(0, 500) },
    });
    // 200 de propósito: o evento está salvo e o job de reconciliação assume.
  }

  return NextResponse.json({ recebido: true });
}

function safeJson(texto: string) {
  try {
    return JSON.parse(texto);
  } catch {
    return { raw: texto.slice(0, 4000) };
  }
}
