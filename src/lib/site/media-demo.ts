/**
 * Imagens de demonstração.
 *
 * Centralizadas aqui para que a troca pelas fotos reais da igreja seja um
 * único arquivo — a equipe de mídia publica pelo painel e os registros do
 * banco passam a ter precedência sobre estas.
 */
const U = (id: string, w = 1920) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const SLIDES_DEMO = [
  {
    id: 'celebracao',
    eyebrow: 'Domingo · 18h30',
    title: 'Venha celebrar conosco',
    subtitle:
      'Um culto de adoração, palavra e comunhão para toda a família. Chegue 15 minutos antes — nossa equipe estará na porta te esperando.',
    imageUrl: U('1438232992991-995b7058bbb3'),
    badge: 'Culto de Celebração',
    ctaLabel: 'Ver a programação',
    ctaHref: '/cultos',
    secondaryLabel: 'Como chegar',
    secondaryHref: '#mapa',
  },
  {
    id: 'jovens',
    eyebrow: 'Sexta-feira · 20h',
    title: 'MEB Jovens: sua geração tem lugar aqui',
    subtitle:
      'Louvor, mensagem e amizade de verdade. Se você tem entre 15 e 30 anos, essa noite foi feita pra você.',
    imageUrl: U('1519892300165-cb5542fb47c7'),
    badge: 'Juventude',
    ctaLabel: 'Conhecer o MEB Jovens',
    ctaHref: '/ministerios',
    secondaryLabel: 'Ver eventos',
    secondaryHref: '/eventos',
  },
  {
    id: 'oracao',
    eyebrow: 'Terça-feira · 19h30',
    title: 'Ninguém carrega o peso sozinho',
    subtitle:
      'Culto de oração e libertação. Traga seu pedido — e, se preferir, escreva anonimamente no nosso mural.',
    imageUrl: U('1507692049790-de58290a4334'),
    badge: 'Culto de Oração',
    ctaLabel: 'Escrever no mural',
    ctaHref: '/mural',
    secondaryLabel: 'Pedidos de oração',
    secondaryHref: '/mural',
  },
  {
    id: 'missoes',
    eyebrow: 'O ano todo',
    title: 'Do Rio de Janeiro para o mundo',
    subtitle:
      'Já enviamos equipes a seis países. Conheça os campos missionários que a MEB sustenta e participe da próxima viagem.',
    imageUrl: U('1526772662000-3f88f10405ff'),
    badge: 'Missões',
    ctaLabel: 'Ver campos missionários',
    ctaHref: '/eventos',
    secondaryLabel: 'Sobre a igreja',
    secondaryHref: '/sobre',
  },
  {
    id: 'ceia',
    eyebrow: 'Primeiro domingo do mês',
    title: 'A mesa está posta para você',
    subtitle:
      'Santa Ceia com toda a igreja reunida. Um tempo de gratidão, entrega e reconciliação.',
    imageUrl: U('1544427920-c49ccfb85579'),
    badge: 'Santa Ceia',
    ctaLabel: 'Programação completa',
    ctaHref: '/cultos',
    secondaryLabel: 'Fale conosco',
    secondaryHref: '/contato',
  },
] as const;

export const GALERIA_DEMO = [
  U('1511632765486-a01980e01a18', 1200),
  U('1470229722913-7ea0d0dcbcbe', 1200),
  U('1523580494863-6f3031224c94', 1200),
  U('1533174072545-7a4b6ad7a6c3', 1200),
  U('1540575467063-178a50c2df87', 1200),
  U('1505236858219-8359eb29e329', 1200),
  U('1492684223066-81342ee5ff30', 1200),
  U('1519741497674-611481863552', 1200),
];

export const CAPAS_EVENTOS: Record<string, string> = {
  'retiro-de-carnaval': U('1533105079780-92b9be482077', 1600),
  jumeb: U('1516450360452-9312f5e86fc7', 1600),
  'missoes-mundo': U('1526772662000-3f88f10405ff', 1600),
  'congresso-de-familias': U('1511632765486-a01980e01a18', 1600),
  'acampamento-kids': U('1502086223501-7ea6ecd79368', 1600),
  'conferencia-de-lideres': U('1540575467063-178a50c2df87', 1600),
};
