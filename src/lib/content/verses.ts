import 'server-only';
import { prisma, safeQuery } from '@/lib/db';
import { localDateKey } from '@/lib/utils/format';
import { VERSICULOS_BASE } from './verses-data';

/**
 * Versículo do dia.
 *
 * A seleção é *determinística*: uma função da data local (America/São_Paulo).
 * Isso garante que servidor, cache de borda e cliente cheguem ao mesmo
 * versículo, e que a virada aconteça exatamente às 00:00 — sem depender de
 * um job ter rodado. O job noturno apenas materializa o registro e permite
 * que a pastoral edite a reflexão do dia.
 */

export type VersiculoDoDia = {
  localDate: string;
  reference: string;
  text: string;
  version: string;
  theme: string | null;
  reflection: string | null;
};

/** Hash estável (FNV-1a) da data → índice de rotação. */
function hashData(chave: string) {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export async function versiculoDoDia(data = new Date()): Promise<VersiculoDoDia> {
  const localDate = localDateKey(data);

  const materializado = await safeQuery(
    () => prisma.dailyVerse.findUnique({ where: { localDate }, include: { verse: true } }),
    null,
  );
  if (materializado) {
    return {
      localDate,
      reference: materializado.verse.reference,
      text: materializado.verse.text,
      version: materializado.verse.version,
      theme: materializado.verse.theme,
      reflection: materializado.reflection,
    };
  }

  const total = await safeQuery(() => prisma.verse.count({ where: { active: true } }), 0);
  if (total > 0) {
    const indice = hashData(localDate) % total;
    const [verso] = await safeQuery(
      () => prisma.verse.findMany({ where: { active: true }, orderBy: { rotationIndex: 'asc' }, skip: indice, take: 1 }),
      [],
    );
    if (verso) {
      // Materializa para permitir edição pastoral da reflexão.
      await safeQuery(
        () =>
          prisma.dailyVerse.upsert({
            where: { localDate },
            create: { localDate, verseId: verso.id },
            update: {},
          }),
        null,
      );
      return {
        localDate,
        reference: verso.reference,
        text: verso.text,
        version: verso.version,
        theme: verso.theme,
        reflection: null,
      };
    }
  }

  const fallback = VERSICULOS_BASE[hashData(localDate) % VERSICULOS_BASE.length]!;
  return { localDate, ...fallback, reflection: null };
}

export { VERSICULOS_BASE } from './verses-data';
