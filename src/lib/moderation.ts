/**
 * Moderação do mural de orações.
 *
 * Camada 1 (aqui): heurística determinística, instantânea e sem custo —
 * roda em toda submissão e resolve a maior parte dos casos.
 * Camada 2: fila humana para o que ficar na faixa cinzenta.
 * Camada 3 (opcional): classificador externo, plugável via `classificador`.
 *
 * O mural é um lugar de dor real; a régua é calibrada para NÃO bloquear
 * desabafo pesado (luto, depressão, vício), apenas ataque, spam e exposição
 * de terceiros.
 */

const PALAVRAS_OFENSIVAS = [
  'idiota', 'imbecil', 'burro', 'otário', 'otario', 'vagabundo', 'vagabunda',
  'desgraçado', 'desgracado', 'lixo humano', 'morra', 'se mata',
];

const PADRAO_SPAM = [
  /\b(?:https?:\/\/|www\.)\S+/gi,
  /\b(?:whatsapp|whats|zap)\s*[:.]?\s*\+?\d{8,}/gi,
  /\b(?:compre|promo(?:ção|cao)|desconto|ganhe dinheiro|renda extra|invista)\b/gi,
];

const PADRAO_CONTATO = [
  /\b\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, // telefone BR
  /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g, // e-mail
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF
];

/** Sinais de risco à vida — não bloqueiam, mas acionam acolhimento imediato. */
const PADRAO_CRISE = [
  /\b(?:me matar|suic[ií]dio|tirar minha vida|acabar com tudo|n[aã]o aguento mais viver)\b/i,
  /\b(?:automutila|me cortar)\b/i,
];

export type ResultadoModeracao = {
  score: number; // 0 = seguro, 1 = risco alto
  aprovadoAutomaticamente: boolean;
  precisaRevisao: boolean;
  bloqueado: boolean;
  crise: boolean;
  motivos: string[];
  textoSanitizado: string;
};

export function moderarTexto(texto: string): ResultadoModeracao {
  const motivos: string[] = [];
  let score = 0;
  let sanitizado = texto.trim().replace(/\s{3,}/g, '  ');

  const normalizado = sanitizado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Escalonamento por quantidade de termos distintos.
  //
  // Um único palavrão dentro de um desabafo pesado NÃO é motivo para
  // bloquear — vai para revisão humana. Três ou mais termos ofensivos
  // caracterizam agressão e são barrados automaticamente.
  const ofensivosEncontrados = PALAVRAS_OFENSIVAS.filter((palavra) =>
    normalizado.includes(palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
  );
  if (ofensivosEncontrados.length > 0) {
    score += Math.min(0.75, 0.35 + (ofensivosEncontrados.length - 1) * 0.2);
    motivos.push(
      ofensivosEncontrados.length === 1
        ? 'linguagem ofensiva'
        : `linguagem ofensiva (${ofensivosEncontrados.length} termos)`,
    );
  }

  for (const padrao of PADRAO_SPAM) {
    if (padrao.test(sanitizado)) {
      score += 0.5;
      motivos.push('possível divulgação/spam');
      break;
    }
  }

  // Dados de contato são removidos (protege o autor e terceiros).
  let removeuContato = false;
  for (const padrao of PADRAO_CONTATO) {
    if (padrao.test(sanitizado)) {
      sanitizado = sanitizado.replace(padrao, '[dado removido]');
      removeuContato = true;
    }
  }
  if (removeuContato) {
    score += 0.15;
    motivos.push('dados pessoais removidos');
  }

  // CAPS LOCK extenso e repetição de caracteres
  const letras = sanitizado.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letras.length > 30 && letras === letras.toUpperCase()) {
    score += 0.1;
    motivos.push('texto todo em maiúsculas');
    sanitizado = sanitizado.charAt(0) + sanitizado.slice(1).toLowerCase();
  }
  if (/(.)\1{6,}/.test(sanitizado)) {
    score += 0.1;
    motivos.push('caracteres repetidos');
  }

  const crise = PADRAO_CRISE.some((p) => p.test(sanitizado));
  if (crise) motivos.push('sinal de crise — acolhimento prioritário');

  score = Math.min(1, score);

  return {
    score,
    aprovadoAutomaticamente: score < 0.3 && !crise,
    precisaRevisao: (score >= 0.3 && score < 0.7) || crise,
    bloqueado: score >= 0.7,
    crise,
    motivos,
    textoSanitizado: sanitizado,
  };
}

/** Mensagem de acolhimento exibida quando detectamos sinal de crise. */
export const ACOLHIMENTO_CRISE = {
  titulo: 'Você não está sozinho.',
  corpo:
    'Sua vida é preciosa. Nossa equipe pastoral foi avisada e vai te procurar. Se você está em risco agora, ligue 188 (CVV — gratuito, 24h) ou vá ao pronto-socorro mais próximo.',
  telefone: '188',
};
