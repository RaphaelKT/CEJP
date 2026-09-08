import type { PrayerCategory } from '@prisma/client';

/**
 * Constantes compartilhadas entre servidor e navegador.
 * Vivem fora de `lib/prayer.ts` porque aquele módulo é `server-only`
 * (acessa banco e barramento de eventos) e não pode entrar no bundle.
 */
export const CATEGORIAS: { valor: PrayerCategory; rotulo: string; emoji: string }[] = [
  { valor: 'SAUDE', rotulo: 'Saúde', emoji: '🩺' },
  { valor: 'FAMILIA', rotulo: 'Família', emoji: '🏠' },
  { valor: 'TRABALHO_E_PROVISAO', rotulo: 'Trabalho e provisão', emoji: '💼' },
  { valor: 'ESTUDOS', rotulo: 'Estudos', emoji: '📚' },
  { valor: 'ESPIRITUAL', rotulo: 'Vida espiritual', emoji: '🕊️' },
  { valor: 'RELACIONAMENTOS', rotulo: 'Relacionamentos', emoji: '💞' },
  { valor: 'LUTO', rotulo: 'Luto', emoji: '🤍' },
  { valor: 'GRATIDAO', rotulo: 'Gratidão', emoji: '🙌' },
  { valor: 'OUTRO', rotulo: 'Outro', emoji: '✨' },
];

/** Respostas prontas — reduzem atrito e mantêm o tom do mural. */
export const RESPOSTAS_RAPIDAS = [
  'Estou orando por você agora. 🙏',
  'Deus está no controle. Firmeza!',
  'Levei seu pedido diante do Senhor.',
  'Você não está sozinho(a). Estamos com você.',
  'Que o Senhor te dê paz que excede todo entendimento.',
];
