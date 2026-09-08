import 'server-only';
import { prisma, safeQuery } from '@/lib/db';
import { publish } from '@/lib/realtime/bus';

/**
 * Contadores públicos exibidos na home.
 *
 * Cada chave é derivada de uma consulta real ao banco. Ao recalcular,
 * guardamos o valor anterior (para a animação de contagem) e publicamos
 * o novo valor no barramento — a home atualiza sozinha, sem recarregar.
 */
export const CONTADORES_DERIVADOS = {
  membros: () => prisma.user.count({ where: { membershipStage: 'MEMBRO', deletedAt: null } }),
  igrejas_oficiais: () => prisma.church.count({ where: { official: true, closedAt: null } }),
  paises: async () => {
    const grupos = await prisma.church.findMany({
      where: { official: true, closedAt: null },
      select: { countryCode: true },
      distinct: ['countryCode'],
    });
    return grupos.length;
  },
  pedidos_de_oracao: () => prisma.prayerRequest.count({ where: { status: { in: ['PUBLICADO', 'RESPONDIDO'] } } }),
  oracoes_registradas: () => prisma.prayerInteraction.count(),
  inscricoes_confirmadas: () => prisma.registration.count({ where: { status: { in: ['CONFIRMADA', 'CHECK_IN_REALIZADO'] } } }),
  presencas_no_mes: () => {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    return prisma.checkIn.count({ where: { status: 'CONFIRMADO', checkedInAt: { gte: inicio } } });
  },
} as const;

export type ChaveContador = keyof typeof CONTADORES_DERIVADOS;

export const ROTULOS: Record<ChaveContador, { label: string; suffix?: string; iconKey: string }> = {
  membros: { label: 'Membros ativos', iconKey: 'users' },
  igrejas_oficiais: { label: 'Igrejas oficiais', iconKey: 'church' },
  paises: { label: 'Países alcançados', iconKey: 'globe' },
  pedidos_de_oracao: { label: 'Pedidos de oração', iconKey: 'heart' },
  oracoes_registradas: { label: 'Orações intercedidas', iconKey: 'hands' },
  inscricoes_confirmadas: { label: 'Inscrições confirmadas', iconKey: 'ticket' },
  presencas_no_mes: { label: 'Presenças no mês', iconKey: 'calendar' },
};

/** Recalcula um subconjunto (ou todos) e emite o evento de atualização. */
export async function recalcularContadores(chaves?: ChaveContador[]) {
  const alvos = (chaves ?? (Object.keys(CONTADORES_DERIVADOS) as ChaveContador[])).filter(
    (k) => k in CONTADORES_DERIVADOS,
  );
  const atualizados: { key: string; label: string; value: number; previousValue: number }[] = [];

  for (const chave of alvos) {
    const valor = await safeQuery(() => CONTADORES_DERIVADOS[chave](), -1);
    if (valor < 0) continue;

    const registro = await safeQuery(
      () =>
        prisma.statCounter.upsert({
          where: { key: chave },
          create: {
            key: chave,
            label: ROTULOS[chave].label,
            value: valor,
            previousValue: 0,
            iconKey: ROTULOS[chave].iconKey,
            source: 'auto',
          },
          update: {},
        }),
      null,
    );
    if (!registro) continue;

    if (registro.value !== valor) {
      const novo = await prisma.statCounter.update({
        where: { key: chave },
        data: { previousValue: registro.value, value: valor },
      });
      await prisma.statSnapshot.create({ data: { counterId: novo.id, value: valor } });
      atualizados.push({ key: chave, label: novo.label, value: valor, previousValue: registro.value });
    }
  }

  if (atualizados.length) publish('contadores', atualizados);
  return atualizados;
}

/** Leitura para a home — com fallback institucional se o banco não existir. */
export async function lerContadoresPublicos() {
  const chavesHome: ChaveContador[] = ['membros', 'igrejas_oficiais', 'paises', 'oracoes_registradas'];
  const registros = await safeQuery(
    () => prisma.statCounter.findMany({ where: { key: { in: chavesHome } }, orderBy: { order: 'asc' } }),
    [],
  );

  const porChave = new Map(registros.map((r) => [r.key, r]));
  const FALLBACK: Record<string, number> = {
    membros: 4820,
    igrejas_oficiais: 37,
    paises: 6,
    oracoes_registradas: 128_540,
  };

  return chavesHome.map((key) => {
    const r = porChave.get(key);
    return {
      key,
      label: ROTULOS[key].label,
      iconKey: ROTULOS[key].iconKey,
      value: r?.value ?? FALLBACK[key] ?? 0,
      previousValue: r?.previousValue ?? 0,
    };
  });
}
