import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma, safeQuery } from '@/lib/db';
import { GRADE_PADRAO, IGREJA } from '@/lib/site/config';
import { CAPAS_EVENTOS, SLIDES_DEMO, GALERIA_DEMO } from '@/lib/site/media-demo';
import type { Culto } from '@/components/home/ServicesSection';
import type { Slide } from '@/components/home/HeroCarousel';
import type { EventoResumo } from '@/components/eventos/EventCard';
import type { PedidoPublico } from '@/components/mural/PrayerCard';

/**
 * Camada de leitura das páginas públicas.
 *
 * Toda consulta passa por `safeQuery`: se o Postgres ainda não estiver
 * provisionado (primeiro clone, ambiente de demonstração), o site renderiza
 * com o conteúdo institucional padrão em vez de quebrar.
 */

export async function lerSlides(): Promise<Slide[]> {
  const agora = new Date();
  const doBanco = await safeQuery(
    () =>
      prisma.heroSlide.findMany({
        where: {
          active: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: agora } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: agora } }] },
          ],
        },
        orderBy: { order: 'asc' },
        take: 8,
      }),
    [],
  );

  if (!doBanco.length) return SLIDES_DEMO as unknown as Slide[];

  return doBanco.map((s) => ({
    id: s.id,
    eyebrow: s.eyebrow ?? '',
    title: s.title,
    subtitle: s.subtitle ?? '',
    imageUrl: s.imageUrl,
    badge: s.badge ?? undefined,
    ctaLabel: s.ctaLabel ?? undefined,
    ctaHref: s.ctaHref ?? undefined,
    secondaryLabel: s.secondaryLabel ?? undefined,
    secondaryHref: s.secondaryHref ?? undefined,
  }));
}

export async function lerCultos(): Promise<Culto[]> {
  const doBanco = await safeQuery(
    () =>
      prisma.serviceSchedule.findMany({
        where: { active: true, church: { status: 'SEDE' } },
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      }),
    [],
  );

  if (!doBanco.length) {
    return GRADE_PADRAO.map((c) => ({
      weekday: c.weekday,
      startTime: c.startTime,
      title: c.title,
      audience: c.audience,
      highlight: c.highlight,
      kind: c.kind,
      endTime: null,
      description: null,
    }));
  }

  return doBanco.map((c) => ({
    weekday: c.weekday,
    startTime: c.startTime,
    endTime: c.endTime,
    title: c.title,
    audience: c.audience,
    description: c.description,
    highlight: c.highlight,
    kind: c.kind,
  }));
}

/* ------------------------------------------------------------------ */
/*  Eventos                                                            */
/* ------------------------------------------------------------------ */

const EVENTOS_DEMO: EventoResumo[] = [
  {
    slug: 'retiro-de-carnaval',
    editionSlug: 'retiro-de-carnaval-2027',
    nome: 'Retiro de Carnaval',
    tagline: 'Quatro dias que reposicionam o ano inteiro',
    categoria: 'RETIRO',
    resumo:
      'Enquanto a cidade para, a igreja sobe a serra. Quatro dias de louvor, ministração, descanso e comunhão em Teresópolis — com programação para adultos, jovens e crianças.',
    capa: CAPAS_EVENTOS['retiro-de-carnaval']!,
    ano: 2027,
    inicio: '2027-02-06T14:00:00.000Z',
    fim: '2027-02-09T14:00:00.000Z',
    local: 'Serra dos Órgãos — Teresópolis/RJ',
    status: 'INSCRICOES_ABERTAS',
    precoDesdeCents: 62000,
    vagasRestantes: 84,
    capacidade: 420,
    vendidos: 336,
    destaque: true,
  },
  {
    slug: 'jumeb',
    editionSlug: 'jumeb-2026',
    nome: 'JUMEB',
    tagline: 'Juventude Missão Evangélica do Brasil',
    categoria: 'ENCONTRO_JOVENS',
    resumo:
      'O maior encontro da nossa juventude. Três noites de louvor, palavra e envio, reunindo jovens de todas as congregações da MEB e igrejas parceiras.',
    capa: CAPAS_EVENTOS.jumeb!,
    ano: 2026,
    inicio: '2026-10-16T22:00:00.000Z',
    fim: '2026-10-18T23:00:00.000Z',
    local: 'Templo Sede — Padre Miguel/RJ',
    status: 'INSCRICOES_ABERTAS',
    precoDesdeCents: 9000,
    vagasRestantes: 512,
    capacidade: 1800,
    vendidos: 1288,
    destaque: true,
  },
  {
    slug: 'missoes-mundo',
    editionSlug: 'missoes-mundo-2027',
    nome: 'Missões ao Redor do Mundo',
    tagline: 'Moçambique · Paraguai · Nepal',
    categoria: 'MISSAO',
    resumo:
      'Viagens missionárias de curta duração com preparo, envio e acompanhamento. Você vai, a igreja sustenta — e uma comunidade inteira é alcançada.',
    capa: CAPAS_EVENTOS['missoes-mundo']!,
    ano: 2027,
    inicio: '2027-07-05T12:00:00.000Z',
    fim: '2027-07-19T12:00:00.000Z',
    local: 'Três campos internacionais',
    status: 'INSCRICOES_EM_BREVE',
    precoDesdeCents: 480000,
    vagasRestantes: 36,
    capacidade: 36,
    vendidos: 0,
    destaque: true,
  },
  {
    slug: 'congresso-de-familias',
    editionSlug: 'congresso-de-familias-2026',
    nome: 'Congresso de Famílias',
    tagline: 'Casamento, filhos e propósito',
    categoria: 'CONGRESSO',
    resumo:
      'Dois dias com preletores convidados tratando de casamento, criação de filhos, finanças do lar e restauração de relacionamentos.',
    capa: CAPAS_EVENTOS['congresso-de-familias']!,
    ano: 2026,
    inicio: '2026-11-13T21:00:00.000Z',
    fim: '2026-11-15T21:00:00.000Z',
    local: 'Templo Sede — Padre Miguel/RJ',
    status: 'INSCRICOES_ABERTAS',
    precoDesdeCents: 12000,
    vagasRestantes: 210,
    capacidade: 900,
    vendidos: 690,
  },
  {
    slug: 'acampamento-kids',
    editionSlug: 'acampamento-kids-2027',
    nome: 'Acampamento Kids',
    tagline: 'De 6 a 12 anos',
    categoria: 'ACAMPAMENTO',
    resumo:
      'Três dias de aventura, brincadeiras e ensino bíblico com equipe treinada, enfermeira no local e proporção de um monitor para cada seis crianças.',
    capa: CAPAS_EVENTOS['acampamento-kids']!,
    ano: 2027,
    inicio: '2027-01-15T13:00:00.000Z',
    fim: '2027-01-17T20:00:00.000Z',
    local: 'Chácara Betel — Guapimirim/RJ',
    status: 'INSCRICOES_EM_BREVE',
    precoDesdeCents: 39000,
    vagasRestantes: 120,
    capacidade: 120,
    vendidos: 0,
  },
  {
    slug: 'conferencia-de-lideres',
    editionSlug: 'conferencia-de-lideres-2026',
    nome: 'Conferência de Líderes',
    tagline: 'Formação para quem serve',
    categoria: 'CONFERENCIA',
    resumo:
      'Capacitação para líderes de células, ministérios e congregações: teologia prática, cuidado pastoral e gestão de equipes voluntárias.',
    capa: CAPAS_EVENTOS['conferencia-de-lideres']!,
    ano: 2026,
    inicio: '2026-09-26T12:00:00.000Z',
    fim: '2026-09-27T21:00:00.000Z',
    local: 'Templo Sede — Padre Miguel/RJ',
    status: 'INSCRICOES_ENCERRADAS',
    precoDesdeCents: 8000,
    vagasRestantes: 0,
    capacidade: 300,
    vendidos: 300,
  },
];

function paraResumo(edicao: {
  slug: string;
  year: number;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  locationLabel: string | null;
  capacity: number;
  soldCount: number;
  coverImageUrl: string | null;
  event: { slug: string; name: string; tagline: string | null; category: string; summary: string };
  ticketTiers: { priceCents: number }[];
}): EventoResumo {
  const precos = edicao.ticketTiers.map((t) => t.priceCents).filter((p) => p > 0);
  return {
    slug: edicao.event.slug,
    editionSlug: edicao.slug,
    nome: edicao.event.name,
    tagline: edicao.event.tagline,
    categoria: edicao.event.category,
    resumo: edicao.event.summary,
    capa: edicao.coverImageUrl ?? CAPAS_EVENTOS[edicao.event.slug] ?? GALERIA_DEMO[0]!,
    ano: edicao.year,
    inicio: edicao.startsAt.toISOString(),
    fim: edicao.endsAt.toISOString(),
    local: edicao.locationLabel ?? `${IGREJA.endereco.bairro} — ${IGREJA.endereco.cidade}/${IGREJA.endereco.estado}`,
    status: edicao.status,
    precoDesdeCents: precos.length ? Math.min(...precos) : null,
    vagasRestantes: edicao.capacity > 0 ? Math.max(0, edicao.capacity - edicao.soldCount) : null,
    capacidade: edicao.capacity,
    vendidos: edicao.soldCount,
  };
}

export async function lerEventos(limite = 12): Promise<EventoResumo[]> {
  const doBanco = await safeQuery(
    () =>
      prisma.eventEdition.findMany({
        where: { status: { notIn: ['RASCUNHO', 'CANCELADO'] }, publishedAt: { not: null } },
        include: { event: true, ticketTiers: { where: { active: true } } },
        orderBy: [{ startsAt: 'asc' }],
        take: limite,
      }),
    [],
  );
  if (!doBanco.length) return EVENTOS_DEMO.slice(0, limite);
  return doBanco.map(paraResumo);
}

export async function lerEventosDestaque(limite = 3): Promise<EventoResumo[]> {
  const eventos = await lerEventos(20);
  const abertos = eventos.filter((e) => e.status === 'INSCRICOES_ABERTAS' || e.status === 'INSCRICOES_EM_BREVE');
  return (abertos.length ? abertos : eventos).slice(0, limite);
}

export async function lerEventoPorSlug(slug: string) {
  const doBanco = await safeQuery(
    () =>
      prisma.event.findUnique({
        where: { slug },
        include: {
          editions: {
            orderBy: { year: 'desc' },
            include: {
              ticketTiers: { where: { active: true }, orderBy: { order: 'asc' } },
              venue: true,
              galleries: { where: { published: true }, include: { items: { include: { asset: true }, orderBy: { order: 'asc' } } } },
            },
          },
        },
      }),
    null,
  );

  if (doBanco && doBanco.editions.length) return doBanco;

  // Fallback institucional para demonstração.
  const demo = EVENTOS_DEMO.find((e) => e.slug === slug);
  if (!demo) return null;
  return {
    id: `demo-${slug}`,
    slug: demo.slug,
    name: demo.nome,
    tagline: demo.tagline,
    category: demo.categoria,
    summary: demo.resumo,
    description: DESCRICOES_DEMO[slug] ?? demo.resumo,
    heroImageUrl: demo.capa,
    accentColor: null,
    iconKey: null,
    featured: Boolean(demo.destaque),
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    editions: [
      {
        id: `demo-ed-${slug}`,
        eventId: `demo-${slug}`,
        slug: demo.editionSlug,
        year: demo.ano,
        title: `${demo.nome} ${demo.ano}`,
        theme: demo.tagline,
        status: demo.status,
        startsAt: new Date(demo.inicio),
        endsAt: new Date(demo.fim),
        registrationOpensAt: null,
        registrationClosesAt: null,
        venueId: null,
        churchId: null,
        locationLabel: demo.local,
        countryCode: 'BR',
        capacity: demo.capacidade,
        soldCount: demo.vendidos,
        waitlistCount: 0,
        minAge: null,
        maxAge: null,
        coverImageUrl: demo.capa,
        trailerUrl: null,
        highlights: DESTAQUES_DEMO[slug] ?? null,
        schedule: null,
        faq: null,
        whatToBring: null,
        refundPolicy: null,
        installmentsMax: 6,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        venue: null,
        galleries: [],
        ticketTiers: demo.precoDesdeCents
          ? [
              {
                id: `demo-tier-${slug}-1`,
                editionId: `demo-ed-${slug}`,
                slug: 'lote-promocional',
                name: 'Lote promocional',
                description: 'Valor reduzido para inscrições antecipadas.',
                audience: 'GERAL',
                priceCents: demo.precoDesdeCents,
                currency: 'BRL',
                salesStartAt: null,
                salesEndAt: null,
                quantityTotal: demo.capacidade,
                quantitySold: demo.vendidos,
                minPerOrder: 1,
                maxPerOrder: 6,
                includesLodging: demo.categoria === 'RETIRO' || demo.categoria === 'ACAMPAMENTO',
                includesMeals: demo.categoria === 'RETIRO' || demo.categoria === 'ACAMPAMENTO',
                includesTransport: false,
                benefits: null,
                active: true,
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]
          : [],
      },
    ],
  } as unknown as EventoDetalhado;
}

/** Tipo do agregado retornado por `lerEventoPorSlug`. */
export type EventoDetalhado = Prisma.EventGetPayload<{
  include: {
    editions: {
      include: {
        ticketTiers: true;
        venue: true;
        galleries: { include: { items: { include: { asset: true } } } };
      };
    };
  };
}>;

const DESCRICOES_DEMO: Record<string, string> = {
  'retiro-de-carnaval':
    'Há mais de vinte anos, enquanto o Rio se enche de blocos, um ônibus sai de Padre Miguel rumo à serra. O Retiro de Carnaval nasceu pequeno, com trinta pessoas em uma casa alugada, e hoje reúne mais de quatrocentos irmãos em quatro dias de imersão.\n\nA programação combina ministrações pela manhã, tempo livre à tarde para descanso e comunhão, e cultos à noite. Há trilha para os jovens, sala infantil com equipe própria e um espaço de aconselhamento pastoral aberto o dia inteiro.\n\nO valor inclui hospedagem, todas as refeições e transporte em ônibus fretado saindo do templo sede.',
  jumeb:
    'O JUMEB é o ponto alto do calendário da juventude. Três noites em que o templo é reconfigurado — palco central, som e luz da nossa equipe de mídia — para receber jovens de todas as congregações da MEB e de igrejas parceiras da Zona Oeste.\n\nCada edição tem um tema, uma banda convidada e um preletor que caminha com a juventude durante o ano seguinte. O encerramento é sempre um culto de envio: quem sente o chamado é ungido e integrado a um ministério.',
  'missoes-mundo':
    'A MEB sustenta campos missionários em seis países. As viagens de curta duração acontecem uma vez por ano e são precedidas de quatro meses de preparo: formação transcultural, idioma básico, saúde do viajante e captação de recursos.\n\nEm 2027 abrimos três destinos — Moçambique (apoio a orfanato e poços artesianos), Paraguai (plantação de igreja em Ciudad del Este) e Nepal (apoio médico e distribuição de Bíblias). As vagas são limitadas e passam por entrevista com a equipe pastoral.',
  'congresso-de-familias':
    'Dois dias inteiros dedicados à família. Palestras pela manhã, oficinas simultâneas à tarde (finanças do lar, comunicação no casamento, adolescentes em casa, luto e recomeço) e plenárias à noite.\n\nHá espaço kids com programação própria durante todas as sessões, e o almoço de sábado é servido no salão da igreja — um dos momentos mais lembrados por quem participa.',
  'acampamento-kids':
    'Três dias pensados do começo ao fim para crianças de 6 a 12 anos. Equipe treinada, enfermeira no local, proporção de um monitor para cada seis crianças e comunicação diária com os pais por grupo dedicado.\n\nA programação mistura gincanas, piscina, oficinas e um enredo bíblico que atravessa todo o acampamento.',
  'conferencia-de-lideres':
    'Formação intensiva para quem já serve. Trilhas em teologia prática, cuidado pastoral, gestão de voluntários e comunicação. A conferência é requisito para assumir liderança de célula ou ministério na MEB.',
};

const DESTAQUES_DEMO: Record<string, string[]> = {
  'retiro-de-carnaval': [
    'Hospedagem, alimentação completa e transporte inclusos',
    'Programação paralela para crianças e adolescentes',
    'Aconselhamento pastoral disponível durante todo o retiro',
    'Parcelamento em até 6x sem juros',
  ],
  jumeb: [
    'Três noites de louvor com banda convidada',
    'Culto de envio no encerramento',
    'Credencial dá acesso à área de alimentação',
    'Meia-entrada para membros com carteirinha',
  ],
  'missoes-mundo': [
    'Quatro meses de preparo transcultural',
    'Seguro viagem e vacinas incluídos',
    'Apoio da igreja na captação de recursos',
    'Acompanhamento pastoral pós-viagem',
  ],
};

/* ------------------------------------------------------------------ */
/*  Mural                                                              */
/* ------------------------------------------------------------------ */

const MURAL_DEMO: Omit<PedidoPublico, 'jaOrei'>[] = [
  {
    id: 'd1', publicId: 'd1', category: 'SAUDE', title: null,
    body: 'Minha mãe entrou na fila do transplante essa semana. Ela está firme na fé, mas eu confesso que estou com medo. Peço que orem por um doador compatível e por paz na nossa casa enquanto esperamos.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 247, replyCount: 12,
    createdAt: new Date(Date.now() - 3_600_000 * 5).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd2', publicId: 'd2', category: 'TRABALHO_E_PROVISAO', title: null,
    body: 'Fui demitido depois de onze anos na mesma empresa. Tenho três filhos e o aluguel vence dia 10. Não sei o que fazer, mas sei que Deus não me abandonou até aqui.',
    displayName: null, anonymous: true, urgent: true, prayerCount: 389, replyCount: 27,
    createdAt: new Date(Date.now() - 3_600_000 * 12).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd3', publicId: 'd3', category: 'GRATIDAO', title: 'Ele respondeu!',
    body: 'Há três meses pedi oração aqui pelo meu casamento. Hoje voltei só para dizer: estamos em aconselhamento, dormindo no mesmo quarto de novo e rindo juntos. Obrigado a cada um que orou.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 512, replyCount: 44,
    createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(), answered: true, replies: [],
  },
  {
    id: 'd4', publicId: 'd4', category: 'FAMILIA', title: null,
    body: 'Meu filho de 17 anos se afastou da igreja e das nossas conversas. Não quero forçar nada, só quero que o coração dele volte a se abrir. Orem por sabedoria pra eu saber a hora de falar e a hora de calar.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 168, replyCount: 9,
    createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd5', publicId: 'd5', category: 'ESPIRITUAL', title: null,
    body: 'Faz meses que oro e sinto o céu de bronze. Continuo vindo aos cultos, continuo lendo a Palavra, mas está seco. Preciso que alguém ore por mim porque hoje eu não consigo.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 301, replyCount: 33,
    createdAt: new Date(Date.now() - 86_400_000 * 4).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd6', publicId: 'd6', category: 'ESTUDOS', title: null,
    body: 'Faço ENEM em novembro e é minha terceira tentativa. Trabalho o dia inteiro e estudo de madrugada. Peço oração por foco, saúde e por uma vaga em enfermagem.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 94, replyCount: 6,
    createdAt: new Date(Date.now() - 86_400_000 * 5).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd7', publicId: 'd7', category: 'LUTO', title: null,
    body: 'Perdi meu pai em julho. Todo mundo já voltou à vida normal e eu ainda travo no supermercado quando vejo o café que ele tomava. Só queria que alguém orasse por mim hoje.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 276, replyCount: 21,
    createdAt: new Date(Date.now() - 86_400_000 * 6).toISOString(), answered: false, replies: [],
  },
  {
    id: 'd8', publicId: 'd8', category: 'RELACIONAMENTOS', title: null,
    body: 'Briguei feio com minha irmã e faz dois anos que a gente não se fala. O orgulho é grande dos dois lados. Preciso de coragem pra dar o primeiro passo.',
    displayName: null, anonymous: true, urgent: false, prayerCount: 143, replyCount: 15,
    createdAt: new Date(Date.now() - 86_400_000 * 7).toISOString(), answered: false, replies: [],
  },
];

export async function lerMural(opcoes: { limite?: number; categoria?: string | null; ordem?: string; cursor?: string | null; fingerprint?: string } = {}) {
  const { limite = 12, categoria, ordem = 'recentes', fingerprint } = opcoes;

  const ordenacao =
    ordem === 'mais_orados'
      ? [{ prayerCount: 'desc' as const }, { createdAt: 'desc' as const }]
      : ordem === 'urgentes'
        ? [{ urgent: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

  const cursorId = opcoes.cursor
    ? await safeQuery(() => prisma.prayerRequest.findUnique({ where: { publicId: opcoes.cursor! }, select: { id: true } }), null)
    : null;

  const registros = await safeQuery(
    () =>
      prisma.prayerRequest.findMany({
        where: {
          status: { in: ['PUBLICADO', 'RESPONDIDO'] },
          ...(categoria ? { category: categoria as never } : {}),
        },
        orderBy: ordenacao,
        take: limite + 1,
        ...(cursorId ? { cursor: { id: cursorId.id }, skip: 1 } : {}),
        include: {
          replies: { where: { hidden: false }, orderBy: { createdAt: 'asc' }, take: 5 },
          interactions: fingerprint ? { where: { fingerprint }, take: 1 } : false,
        },
      }),
    [],
  );

  if (!registros.length && !opcoes.cursor) {
    const filtrados = categoria ? MURAL_DEMO.filter((p) => p.category === categoria) : MURAL_DEMO;
    const ordenados =
      ordem === 'mais_orados'
        ? [...filtrados].sort((a, b) => b.prayerCount - a.prayerCount)
        : ordem === 'urgentes'
          ? [...filtrados].sort((a, b) => Number(b.urgent) - Number(a.urgent))
          : filtrados;
    return { pedidos: ordenados.slice(0, limite).map((p) => ({ ...p, jaOrei: false })), temMais: false };
  }

  const temMais = registros.length > limite;
  const pagina = registros.slice(0, limite);

  return {
    pedidos: pagina.map((p) => ({
      id: p.id,
      publicId: p.publicId,
      category: p.category,
      title: p.title,
      body: p.body,
      displayName: p.displayName,
      anonymous: p.anonymous,
      urgent: p.urgent,
      prayerCount: p.prayerCount,
      replyCount: p.replyCount,
      createdAt: p.createdAt.toISOString(),
      answered: p.status === 'RESPONDIDO',
      jaOrei: Array.isArray(p.interactions) ? p.interactions.length > 0 : false,
      replies: p.replies.map((r) => ({
        id: r.id,
        body: r.body,
        displayName: r.displayName,
        createdAt: r.createdAt.toISOString(),
      })),
    })) satisfies PedidoPublico[],
    temMais,
  };
}

export async function contarPedidos() {
  const total = await safeQuery(
    () => prisma.prayerRequest.count({ where: { status: { in: ['PUBLICADO', 'RESPONDIDO'] } } }),
    0,
  );
  return total || 12_480;
}
