/** Dados institucionais usados em toda a aplicação (fonte única). */

export const IGREJA = {
  nome: 'Missão Evangélica do Brasil',
  sigla: 'MEB',
  lema: 'Uma casa de fé, acolhimento e propósito.',
  fundacao: 1987,
  endereco: {
    logradouro: 'Estrada da Água Branca, 3570',
    bairro: 'Padre Miguel',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '21720-161',
    completo: 'Estrada da Água Branca, 3570 — Padre Miguel, Rio de Janeiro, RJ, 21720-161',
  },
  /** Coordenadas da sede — base da geocerca de presença e validação de fotos. */
  coordenadas: { latitude: -22.8735, longitude: -43.4426 },
  contato: {
    telefone: '(21) 3333-0000',
    whatsapp: '5521999990000',
    email: 'contato@missaoevangelicadobrasil.org.br',
    secretaria: 'secretaria@missaoevangelicadobrasil.org.br',
  },
  redes: {
    instagram: 'https://instagram.com/missaoevangelicadobrasil',
    youtube: 'https://youtube.com/@missaoevangelicadobrasil',
    facebook: 'https://facebook.com/missaoevangelicadobrasil',
    spotify: 'https://open.spotify.com/',
  },
} as const;

export const NAV_PRINCIPAL = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre nós' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/mural', label: 'Mural de orações' },
  { href: '/cultos', label: 'Cultos' },
  { href: '/contato', label: 'Contato' },
] as const;

export const NAV_RODAPE = [
  {
    titulo: 'A igreja',
    itens: [
      { href: '/sobre', label: 'Nossa história' },
      { href: '/sobre#fe', label: 'Declaração de fé' },
      { href: '/sobre#lideranca', label: 'Liderança' },
      { href: '/cultos', label: 'Programação semanal' },
      { href: '/congregacoes', label: 'Congregações' },
    ],
  },
  {
    titulo: 'Participe',
    itens: [
      { href: '/eventos', label: 'Eventos e retiros' },
      { href: '/mural', label: 'Mural de orações' },
      { href: '/ministerios', label: 'Ministérios' },
      { href: '/contribuir', label: 'Dízimos e ofertas' },
      { href: '/cadastro', label: 'Criar minha conta' },
    ],
  },
  {
    titulo: 'Transparência',
    itens: [
      { href: '/privacidade', label: 'Política de privacidade' },
      { href: '/termos', label: 'Termos de uso' },
      { href: '/prestacao-de-contas', label: 'Prestação de contas' },
      { href: '/contato', label: 'Fale conosco' },
    ],
  },
] as const;

/** Grade semanal exibida quando o banco ainda não foi populado. */
export const GRADE_PADRAO = [
  { weekday: 0, startTime: '09:00', title: 'Escola Bíblica Dominical', kind: 'ESCOLA_BIBLICA', audience: 'Todas as idades', highlight: false },
  { weekday: 0, startTime: '18:30', title: 'Culto de Celebração', kind: 'CULTO_CELEBRACAO', audience: 'Toda a família', highlight: true },
  { weekday: 2, startTime: '19:30', title: 'Culto de Oração e Libertação', kind: 'CULTO_ORACAO', audience: 'Aberto a todos', highlight: false },
  { weekday: 4, startTime: '19:30', title: 'Culto de Ensino da Palavra', kind: 'CULTO_ENSINO', audience: 'Discipulado', highlight: false },
  { weekday: 5, startTime: '20:00', title: 'MEB Jovens — Culto da Juventude', kind: 'CULTO_JOVENS', audience: '15 a 30 anos', highlight: true },
  { weekday: 6, startTime: '19:00', title: 'Culto de Missões', kind: 'CULTO_CELEBRACAO', audience: 'Toda a família', highlight: false },
] as const;
