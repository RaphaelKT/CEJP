import 'server-only';
import { prisma } from '@/lib/db';
import { getGateway } from './gateway';
import { aplicarResultado } from './service';

/**
 * Conciliação financeira.
 *
 * Webhooks se perdem: o provedor pode falhar, a rede cair, o deploy estar no
 * ar no momento exato da notificação. Esta rotina é a rede de segurança —
 * ela consulta o provedor sobre todo pagamento ainda pendente e reaplica o
 * estado real. Também expira PIX/boletos vencidos, devolvendo as vagas.
 */
export async function reconciliarPagamentos() {
  const gateway = getGateway();

  const pendentes = await prisma.payment.findMany({
    where: {
      status: { in: ['CRIADO', 'PENDENTE', 'EM_ANALISE', 'AUTORIZADO'] },
      providerPaymentId: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
    },
    select: { id: true, providerPaymentId: true, status: true },
    take: 300,
  });

  let atualizados = 0;
  let erros = 0;

  for (const pagamento of pendentes) {
    try {
      const atual = await gateway.fetchPayment(pagamento.providerPaymentId!);
      if (atual && atual.status !== pagamento.status) {
        await aplicarResultado(pagamento.id, atual, 'reconciliacao');
        atualizados += 1;
      }
    } catch {
      erros += 1;
    }
  }

  // Expiração de cobranças vencidas + devolução das vagas reservadas.
  const vencidos = await prisma.payment.findMany({
    where: {
      status: { in: ['CRIADO', 'PENDENTE'] },
      expiresAt: { lt: new Date() },
    },
    include: { order: { include: { items: true } } },
    take: 200,
  });

  for (const pagamento of vencidos) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: pagamento.id }, data: { status: 'EXPIRADO' } });
      await tx.order.update({
        where: { id: pagamento.orderId },
        data: { status: 'EXPIRADO', canceledAt: new Date(), cancelReason: 'pagamento_expirado' },
      });
      await tx.registration.updateMany({
        where: { orderId: pagamento.orderId, status: 'AGUARDANDO_PAGAMENTO' },
        data: { status: 'CANCELADA', cancelReason: 'pagamento_expirado' },
      });
      for (const item of pagamento.order.items) {
        if (!item.tierId || !item.editionId) continue;
        await tx.ticketTier.update({ where: { id: item.tierId }, data: { quantitySold: { decrement: item.quantity } } });
        await tx.eventEdition.update({ where: { id: item.editionId }, data: { soldCount: { decrement: item.quantity } } });
      }
    });
  }

  // Reprocessa webhooks que falharam.
  const webhooksPendentes = await prisma.webhookEvent.findMany({
    where: { processedAt: null, signatureValid: true, attempts: { lt: 5 } },
    take: 100,
  });

  return {
    consultados: pendentes.length,
    atualizados,
    erros,
    expirados: vencidos.length,
    webhooksPendentes: webhooksPendentes.length,
  };
}
