/* eslint-disable no-console */
/**
 * Popular o banco com a estrutura institucional da Missão Evangélica do Brasil.
 *
 *   npm run db:seed
 *
 * O script é idempotente: pode ser executado quantas vezes for preciso.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { VERSICULOS_BASE } from '../src/lib/content/verses-data';

const prisma = new PrismaClient();
const PEPPER = process.env.HASH_PEPPER ?? 'dev-pepper';
const hash = (senha: string) => bcrypt.hash(senha + PEPPER, 12);

const SEDE = {
  nome: 'Templo Sede — Padre Miguel',
  endereco: 'Estrada da Água Branca, 3570',
  bairro: 'Padre Miguel',
  cidade: 'Rio de Janeiro',
  estado: 'RJ',
  cep: '21720-161',
  latitude: -22.8735,
  longitude: -43.4426,
};

async function main() {
  console.log('▸ Semeando a base da Missão Evangélica do Brasil…\n');

  /* ---------------- Locais ---------------- */
  const sede = await prisma.venue.upsert({
    where: { id: 'venue-sede' },
    create: {
      id: 'venue-sede',
      name: SEDE.nome,
      addressLine: SEDE.endereco,
      neighborhood: SEDE.bairro,
      city: SEDE.cidade,
      state: SEDE.estado,
      postalCode: SEDE.cep,
      latitude: SEDE.latitude,
      longitude: SEDE.longitude,
      geofenceRadiusM: 400,
    },
    update: {},
  });

  const serra = await prisma.venue.upsert({
    where: { id: 'venue-teresopolis' },
    create: {
      id: 'venue-teresopolis',
      name: 'Centro de Retiros Serra dos Órgãos',
      addressLine: 'Estrada da Serra, km 12',
      city: 'Teresópolis',
      state: 'RJ',
      postalCode: '25953-000',
      latitude: -22.4123,
      longitude: -42.9755,
      geofenceRadiusM: 900,
    },
    update: {},
  });

  const guapimirim = await prisma.venue.upsert({
    where: { id: 'venue-guapimirim' },
    create: {
      id: 'venue-guapimirim',
      name: 'Chácara Betel',
      addressLine: 'Estrada do Paraíso, 900',
      city: 'Guapimirim',
      state: 'RJ',
      postalCode: '25940-000',
      latitude: -22.5372,
      longitude: -42.9902,
      geofenceRadiusM: 700,
    },
    update: {},
  });

  console.log('✓ 3 locais com geocerca');

  /* ---------------- Igrejas ---------------- */
  const igrejas: Prisma.ChurchCreateInput[] = [
    { slug: 'sede-padre-miguel', name: 'MEB Sede — Padre Miguel', status: 'SEDE', foundedAt: new Date('1987-06-14'), pastorName: 'Pr. Jonas Ribeiro', venue: { connect: { id: sede.id } } },
    { slug: 'bangu', name: 'MEB Bangu', status: 'CONGREGACAO', foundedAt: new Date('2004-03-07'), pastorName: 'Pr. Elias Moreira' },
    { slug: 'realengo', name: 'MEB Realengo', status: 'CONGREGACAO', foundedAt: new Date('2004-09-12'), pastorName: 'Pr. Adilson Costa' },
    { slug: 'campo-grande', name: 'MEB Campo Grande', status: 'CONGREGACAO', foundedAt: new Date('2006-05-21'), pastorName: 'Pr. Wesley Tavares' },
    { slug: 'santa-cruz', name: 'MEB Santa Cruz', status: 'CONGREGACAO', foundedAt: new Date('2009-08-02'), pastorName: 'Pr. Fábio Andrade' },
    { slug: 'nova-iguacu', name: 'MEB Nova Iguaçu', status: 'CONGREGACAO', foundedAt: new Date('2012-04-15'), pastorName: 'Pr. Rogério Lima' },
    { slug: 'duque-de-caxias', name: 'MEB Duque de Caxias', status: 'CONGREGACAO', foundedAt: new Date('2014-10-05'), pastorName: 'Pr. Sérgio Pinho' },
    { slug: 'niteroi', name: 'MEB Niterói', status: 'CONGREGACAO', foundedAt: new Date('2017-02-19'), pastorName: 'Pr. Marcelo Dias' },
    { slug: 'mocambique-beira', name: 'MEB Missão Beira', status: 'MISSAO_INTERNACIONAL', countryCode: 'MZ', foundedAt: new Date('2011-07-01'), pastorName: 'Miss. Márcio Salles' },
    { slug: 'paraguai-ciudad-del-este', name: 'MEB Ciudad del Este', status: 'MISSAO_INTERNACIONAL', countryCode: 'PY', foundedAt: new Date('2016-03-10') },
    { slug: 'nepal-katmandu', name: 'MEB Katmandu', status: 'MISSAO_INTERNACIONAL', countryCode: 'NP', foundedAt: new Date('2019-11-08') },
    { slug: 'portugal-lisboa', name: 'MEB Lisboa', status: 'MISSAO_INTERNACIONAL', countryCode: 'PT', foundedAt: new Date('2021-06-06') },
    { slug: 'japao-nagoya', name: 'MEB Nagoya', status: 'MISSAO_INTERNACIONAL', countryCode: 'JP', foundedAt: new Date('2022-09-18') },
    { slug: 'eua-boston', name: 'MEB Boston', status: 'MISSAO_INTERNACIONAL', countryCode: 'US', foundedAt: new Date('2023-05-14') },
  ];

  for (const igreja of igrejas) {
    await prisma.church.upsert({ where: { slug: igreja.slug }, create: igreja, update: {} });
  }
  const sedeIgreja = await prisma.church.findUniqueOrThrow({ where: { slug: 'sede-padre-miguel' } });
  console.log(`✓ ${igrejas.length} igrejas (1 sede, 7 congregações, 6 missões internacionais)`);

  /* ---------------- Grade de cultos ---------------- */
  const grade = [
    { kind: 'ESCOLA_BIBLICA' as const, title: 'Escola Bíblica Dominical', weekday: 0, startTime: '09:00', endTime: '10:30', audience: 'Todas as idades', description: 'Classes por faixa etária com estudo sistemático da Palavra.', highlight: false, order: 0 },
    { kind: 'CULTO_CELEBRACAO' as const, title: 'Culto de Celebração', weekday: 0, startTime: '18:30', endTime: '20:30', audience: 'Toda a família', description: 'Nosso principal culto da semana. Louvor, palavra e ministração.', highlight: true, order: 1 },
    { kind: 'CULTO_ORACAO' as const, title: 'Culto de Oração e Libertação', weekday: 2, startTime: '19:30', endTime: '21:00', audience: 'Aberto a todos', description: 'Intercessão pelos pedidos do mural e ministração individual.', highlight: false, order: 2 },
    { kind: 'CULTO_ENSINO' as const, title: 'Culto de Ensino da Palavra', weekday: 4, startTime: '19:30', endTime: '21:00', audience: 'Discipulado', description: 'Estudo expositivo, livro a livro, com espaço para perguntas.', highlight: false, order: 3 },
    { kind: 'CULTO_JOVENS' as const, title: 'MEB Jovens — Culto da Juventude', weekday: 5, startTime: '20:00', endTime: '22:00', audience: '15 a 30 anos', description: 'Louvor contemporâneo, mensagem e comunhão até tarde.', highlight: true, order: 4 },
    { kind: 'CULTO_CELEBRACAO' as const, title: 'Culto de Missões', weekday: 6, startTime: '19:00', endTime: '20:30', audience: 'Toda a família', description: 'Relatos dos campos e envio de novos obreiros.', highlight: false, order: 5 },
    { kind: 'CULTO_INFANTIL' as const, title: 'MEB Kids', weekday: 0, startTime: '18:30', endTime: '20:00', audience: '3 a 11 anos', description: 'Programação paralela ao culto de celebração.', highlight: false, order: 6 },
  ];

  for (const item of grade) {
    const existente = await prisma.serviceSchedule.findFirst({
      where: { churchId: sedeIgreja.id, weekday: item.weekday, startTime: item.startTime, title: item.title },
    });
    if (!existente) await prisma.serviceSchedule.create({ data: { ...item, churchId: sedeIgreja.id } });
  }
  console.log(`✓ ${grade.length} cultos na grade semanal`);

  /* ---------------- Versículos ---------------- */
  for (const [i, verso] of VERSICULOS_BASE.entries()) {
    const [livro, resto] = verso.reference.split(/\s(?=\d+:)/);
    const [capitulo, versiculo] = (resto ?? '1:1').split(':');
    const existente = await prisma.verse.findFirst({ where: { reference: verso.reference } });
    if (!existente) {
      await prisma.verse.create({
        data: {
          reference: verso.reference,
          book: livro ?? verso.reference,
          chapter: Number(capitulo) || 1,
          verse: versiculo ?? '1',
          text: verso.text,
          version: verso.version,
          theme: verso.theme,
          rotationIndex: i + 1,
        },
      });
    }
  }
  console.log(`✓ ${VERSICULOS_BASE.length} versículos no acervo diário`);

  /* ---------------- Regra de membresia ---------------- */
  await prisma.membershipRule.upsert({
    where: { key: 'default' },
    create: { key: 'default', minAttendance: 5, windowDays: 30, requiresPastoralReview: true, minTrustScore: 70, inactivityDays: 120 },
    update: {},
  });
  console.log('✓ Regra de membresia: 5 presenças em 30 dias + confirmação pastoral');

  /* ---------------- Usuários ---------------- */
  const equipe = [
    { email: 'pastor@meb.org.br', fullName: 'Jonas Ribeiro', roles: ['PASTOR', 'ADMIN'] as const, senha: 'Meb@2026' },
    { email: 'secretaria@meb.org.br', fullName: 'Cláudia Nunes', roles: ['SECRETARIA'] as const, senha: 'Meb@2026' },
    { email: 'midia@meb.org.br', fullName: 'Rafael Andrade', roles: ['MIDIA'] as const, senha: 'Meb@2026' },
    { email: 'tesouraria@meb.org.br', fullName: 'Ricardo Alves', roles: ['TESOURARIA'] as const, senha: 'Meb@2026' },
    { email: 'juventude@meb.org.br', fullName: 'Daniel Ferraz', roles: ['LIDER'] as const, senha: 'Meb@2026' },
  ];

  for (const pessoa of equipe) {
    await prisma.user.upsert({
      where: { email: pessoa.email },
      create: {
        email: pessoa.email,
        fullName: pessoa.fullName,
        passwordHash: await hash(pessoa.senha),
        status: 'ATIVO',
        emailVerified: new Date(),
        roles: [...pessoa.roles],
        membershipStage: 'MEMBRO',
        membershipSince: new Date('2020-01-01'),
        homeChurchId: sedeIgreja.id,
        privacyPolicyVersion: '2026.1',
        privacyAcceptedAt: new Date(),
      },
      update: { roles: [...pessoa.roles] },
    });
  }
  console.log(`✓ ${equipe.length} contas de equipe (senha: Meb@2026)`);

  /* ---------------- Congregação de demonstração ---------------- */
  /*
   * Gera pessoas com históricos de presença distintos, para que o motor de
   * membresia e os contadores da home tenham dados reais logo no primeiro
   * acesso. Os nomes são fictícios.
   */
  const NOMES = [
    'Ana Beatriz Souza', 'Carlos Eduardo Lima', 'Débora Martins', 'Eduardo Ramos',
    'Fernanda Alves', 'Gabriel Nascimento', 'Helena Rocha', 'Igor Bezerra',
    'Juliana Prado', 'Kleber Antunes', 'Larissa Campos', 'Marcos Vinícius Dias',
    'Natália Freitas', 'Otávio Barreto', 'Patrícia Gomes', 'Rafael Moura',
    'Simone Cardoso', 'Thiago Peixoto', 'Vanessa Lopes', 'Wagner Teixeira',
    'Amanda Ribeiro', 'Bruno Carvalho', 'Camila Nogueira', 'Diego Farias',
    'Elaine Batista', 'Felipe Monteiro', 'Gisele Duarte', 'Henrique Pires',
    'Isabela Cunha', 'João Pedro Salles', 'Karina Vieira', 'Lucas Amorim',
    'Mariana Fontes', 'Nelson Aguiar', 'Olívia Brandão', 'Paulo Henrique Reis',
    'Renata Siqueira', 'Sandro Melo', 'Tatiane Correia', 'Vitor Hugo Paiva',
    'Adriana Coelho', 'Bernardo Queiroz', 'Cristina Maia', 'Danilo Sampaio',
    'Emanuelle Braga', 'Fábio Torres', 'Graziela Pontes', 'Hugo Serrano',
  ];

  const ocorrenciasPassadas = await prisma.serviceOccurrence.findMany({
    where: { startsAt: { lte: new Date() } },
    orderBy: { startsAt: 'desc' },
    take: 12,
  });

  if (ocorrenciasPassadas.length === 0) {
    // Materializa quatro semanas retroativas para dar história ao seed.
    const gradeSede = await prisma.serviceSchedule.findMany({ where: { churchId: sedeIgreja.id, active: true } });
    for (const item of gradeSede) {
      for (let semana = 1; semana <= 5; semana++) {
        const data = new Date();
        const delta = (item.weekday - data.getDay() - 7) % 7;
        data.setDate(data.getDate() + delta - (semana - 1) * 7);
        const [h, m] = item.startTime.split(':').map(Number);
        data.setHours(h ?? 0, m ?? 0, 0, 0);
        if (data > new Date()) continue;
        const existe = await prisma.serviceOccurrence.findFirst({ where: { scheduleId: item.id, startsAt: data } });
        if (existe) continue;
        await prisma.serviceOccurrence.create({
          data: {
            scheduleId: item.id,
            venueId: sede.id,
            title: item.title,
            startsAt: data,
            endsAt: new Date(data.getTime() + 90 * 60_000),
          },
        });
      }
    }
  }

  const historico = await prisma.serviceOccurrence.findMany({
    where: { startsAt: { lte: new Date(), gte: new Date(Date.now() - 30 * 86_400_000) } },
    orderBy: { startsAt: 'desc' },
  });

  const senhaPadrao = await hash('Meb@2026');
  let promovidos = 0;

  for (const [i, nome] of NOMES.entries()) {
    const email = `${nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '.')}@exemplo.com.br`;
    const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existente) continue;

    // Distribuição: 25% visitantes, 25% frequentadores, 50% assíduos.
    const faixa = i % 4;
    const presencasAlvo = faixa === 0 ? 1 : faixa === 1 ? 3 : Math.min(historico.length, 6 + (i % 3));

    const usuario = await prisma.user.create({
      data: {
        email,
        fullName: nome,
        passwordHash: senhaPadrao,
        status: 'ATIVO',
        emailVerified: new Date(),
        roles: ['VISITANTE'],
        membershipStage: 'VISITANTE',
        homeChurchId: sedeIgreja.id,
        city: 'Rio de Janeiro',
        state: 'RJ',
        privacyPolicyVersion: '2026.1',
        privacyAcceptedAt: new Date(),
        createdAt: new Date(Date.now() - (60 + i) * 86_400_000),
      },
    });

    for (const ocorrencia of historico.slice(0, presencasAlvo)) {
      await prisma.checkIn.create({
        data: {
          userId: usuario.id,
          occurrenceId: ocorrencia.id,
          method: 'QR_ROTATIVO',
          status: 'CONFIRMADO',
          checkedInAt: ocorrencia.startsAt,
          trustScore: 95,
          trustSignals: { token: 'valido', geocerca: 'dentro', janela: 'dentro' },
          latitude: SEDE.latitude + (Math.random() - 0.5) * 0.001,
          longitude: SEDE.longitude + (Math.random() - 0.5) * 0.001,
          distanceM: Math.round(Math.random() * 120),
        },
      });
    }

    if (presencasAlvo >= 5) {
      // Metade já passou pela confirmação pastoral; a outra fica na fila.
      const jaConfirmado = i % 2 === 0;
      await prisma.user.update({
        where: { id: usuario.id },
        data: jaConfirmado
          ? {
              membershipStage: 'MEMBRO',
              roles: ['MEMBRO'],
              membershipSince: new Date(Date.now() - 20 * 86_400_000),
              membershipNumber: `MEB-${new Date().getFullYear()}-${String(1000 + i).padStart(5, '0')}`,
            }
          : { membershipStage: 'EM_AVALIACAO' },
      });
      await prisma.membershipEvent.create({
        data: {
          userId: usuario.id,
          type: jaConfirmado ? 'PROMOVIDO_A_MEMBRO' : 'GATILHO_ATINGIDO',
          fromStage: 'FREQUENTADOR',
          toStage: jaConfirmado ? 'MEMBRO' : 'EM_AVALIACAO',
          period: new Date().toISOString().slice(0, 7),
          evidence: { presencas: presencasAlvo, janelaDias: 30, minimo: 5 },
        },
      });
      if (jaConfirmado) promovidos += 1;
    } else if (presencasAlvo >= 2) {
      await prisma.user.update({ where: { id: usuario.id }, data: { membershipStage: 'FREQUENTADOR' } });
    }

    for (const ocorrencia of historico.slice(0, presencasAlvo)) {
      await prisma.serviceOccurrence.update({
        where: { id: ocorrencia.id },
        data: { attendanceCount: { increment: 1 } },
      });
    }
  }

  // A equipe também frequenta — evita que a varredura de inatividade os marque.
  const equipeIds = await prisma.user.findMany({
    where: { email: { in: equipe.map((e) => e.email) } },
    select: { id: true },
  });
  for (const membro of equipeIds) {
    for (const ocorrencia of historico.slice(0, 8)) {
      const existe = await prisma.checkIn.findUnique({
        where: { userId_occurrenceId: { userId: membro.id, occurrenceId: ocorrencia.id } },
      });
      if (existe) continue;
      await prisma.checkIn.create({
        data: {
          userId: membro.id,
          occurrenceId: ocorrencia.id,
          method: 'MANUAL_SECRETARIA',
          status: 'CONFIRMADO',
          checkedInAt: ocorrencia.startsAt,
          trustScore: 100,
          trustSignals: { token: 'registro_manual_autorizado' },
        },
      });
    }
  }

  console.log(`✓ ${NOMES.length} pessoas na congregação de demonstração (${promovidos} já promovidas a membro)`);

  /* ---------------- Eventos ---------------- */
  const anoAtual = new Date().getFullYear();

  type LoteSeed = {
    slug: string; name: string; priceCents: number;
    audience: 'GERAL' | 'MEMBRO' | 'CRIANCA' | 'JOVEM' | 'CASAL' | 'VOLUNTARIO';
    qtd: number; description: string;
    lodging?: boolean; meals?: boolean; transport?: boolean;
  };

  const eventos: {
    slug: string; name: string; category: 'RETIRO' | 'ENCONTRO_JOVENS' | 'MISSAO' | 'CONGRESSO' | 'ACAMPAMENTO' | 'CONFERENCIA';
    tagline: string; featured: boolean; order: number; summary: string; description: string;
    venueId: string | null; local: string; capacidade: number;
    inicio: Date; fim: Date;
    status: 'INSCRICOES_ABERTAS' | 'INSCRICOES_EM_BREVE';
    destaques: string[]; lotes: LoteSeed[];
  }[] = [
    {
      slug: 'retiro-de-carnaval', name: 'Retiro de Carnaval', category: 'RETIRO' as const,
      tagline: 'Quatro dias que reposicionam o ano inteiro', featured: true, order: 0,
      summary: 'Enquanto a cidade para, a igreja sobe a serra. Quatro dias de louvor, ministração, descanso e comunhão em Teresópolis.',
      description: 'Há mais de vinte anos, enquanto o Rio se enche de blocos, um ônibus sai de Padre Miguel rumo à serra. O Retiro de Carnaval nasceu pequeno, com trinta pessoas em uma casa alugada, e hoje reúne mais de quatrocentos irmãos em quatro dias de imersão.\n\nA programação combina ministrações pela manhã, tempo livre à tarde para descanso e comunhão, e cultos à noite. Há trilha para os jovens, sala infantil com equipe própria e um espaço de aconselhamento pastoral aberto o dia inteiro.\n\nO valor inclui hospedagem, todas as refeições e transporte em ônibus fretado saindo do templo sede.',
      venueId: serra.id, local: 'Serra dos Órgãos — Teresópolis/RJ', capacidade: 420,
      inicio: new Date(`${anoAtual + 1}-02-06T14:00:00-03:00`), fim: new Date(`${anoAtual + 1}-02-09T14:00:00-03:00`),
      status: 'INSCRICOES_ABERTAS' as const,
      destaques: ['Hospedagem, alimentação completa e transporte inclusos', 'Programação paralela para crianças e adolescentes', 'Aconselhamento pastoral durante todo o retiro', 'Parcelamento em até 6x sem juros'],
      lotes: [
        { slug: 'lote-1-adulto', name: '1º lote — Adulto', priceCents: 62000, audience: 'GERAL' as const, qtd: 200, lodging: true, meals: true, transport: true, description: 'Quarto compartilhado, pensão completa e transporte.' },
        { slug: 'lote-1-membro', name: '1º lote — Membro MEB', priceCents: 54000, audience: 'MEMBRO' as const, qtd: 120, lodging: true, meals: true, transport: true, description: 'Condição especial para membros com matrícula ativa.' },
        { slug: 'lote-1-crianca', name: '1º lote — Criança (4 a 11)', priceCents: 32000, audience: 'CRIANCA' as const, qtd: 100, lodging: true, meals: true, transport: true, description: 'Acompanhada de responsável. Menores de 4 anos não pagam.' },
      ],
    },
    {
      slug: 'jumeb', name: 'JUMEB', category: 'ENCONTRO_JOVENS' as const,
      tagline: 'Juventude Missão Evangélica do Brasil', featured: true, order: 1,
      summary: 'O maior encontro da nossa juventude. Três noites de louvor, palavra e envio.',
      description: 'O JUMEB é o ponto alto do calendário da juventude. Três noites em que o templo é reconfigurado — palco central, som e luz da nossa equipe de mídia — para receber jovens de todas as congregações da MEB e de igrejas parceiras da Zona Oeste.\n\nCada edição tem um tema, uma banda convidada e um preletor que caminha com a juventude durante o ano seguinte. O encerramento é sempre um culto de envio.',
      venueId: sede.id, local: 'Templo Sede — Padre Miguel/RJ', capacidade: 1800,
      inicio: new Date(`${anoAtual}-10-16T19:00:00-03:00`), fim: new Date(`${anoAtual}-10-18T22:00:00-03:00`),
      status: 'INSCRICOES_ABERTAS' as const,
      destaques: ['Três noites de louvor com banda convidada', 'Culto de envio no encerramento', 'Credencial dá acesso à área de alimentação', 'Meia-entrada para membros com carteirinha'],
      lotes: [
        { slug: 'jumeb-inteira', name: 'Credencial completa', priceCents: 9000, audience: 'JOVEM' as const, qtd: 1200, description: 'Acesso às três noites + camiseta oficial.' },
        { slug: 'jumeb-membro', name: 'Credencial membro', priceCents: 6000, audience: 'MEMBRO' as const, qtd: 500, description: 'Para membros da MEB com matrícula ativa.' },
        { slug: 'jumeb-voluntario', name: 'Equipe voluntária', priceCents: 3000, audience: 'VOLUNTARIO' as const, qtd: 100, description: 'Para quem serve nas equipes durante o evento.' },
      ],
    },
    {
      slug: 'missoes-mundo', name: 'Missões ao Redor do Mundo', category: 'MISSAO' as const,
      tagline: 'Moçambique · Paraguai · Nepal', featured: true, order: 2,
      summary: 'Viagens missionárias de curta duração com preparo, envio e acompanhamento.',
      description: 'A MEB sustenta campos missionários em seis países. As viagens de curta duração acontecem uma vez por ano e são precedidas de quatro meses de preparo: formação transcultural, idioma básico, saúde do viajante e captação de recursos.\n\nAs vagas são limitadas e passam por entrevista com a equipe pastoral.',
      venueId: null, local: 'Três campos internacionais', capacidade: 36,
      inicio: new Date(`${anoAtual + 1}-07-05T09:00:00-03:00`), fim: new Date(`${anoAtual + 1}-07-19T09:00:00-03:00`),
      status: 'INSCRICOES_EM_BREVE' as const,
      destaques: ['Quatro meses de preparo transcultural', 'Seguro viagem e vacinas incluídos', 'Apoio da igreja na captação de recursos', 'Acompanhamento pastoral pós-viagem'],
      lotes: [
        { slug: 'missao-mocambique', name: 'Campo Moçambique', priceCents: 480000, audience: 'GERAL' as const, qtd: 12, description: 'Apoio a orfanato e construção de poços artesianos.' },
        { slug: 'missao-paraguai', name: 'Campo Paraguai', priceCents: 320000, audience: 'GERAL' as const, qtd: 14, description: 'Plantação de igreja em Ciudad del Este.' },
        { slug: 'missao-nepal', name: 'Campo Nepal', priceCents: 620000, audience: 'GERAL' as const, qtd: 10, description: 'Apoio médico e distribuição de Bíblias.' },
      ],
    },
    {
      slug: 'congresso-de-familias', name: 'Congresso de Famílias', category: 'CONGRESSO' as const,
      tagline: 'Casamento, filhos e propósito', featured: false, order: 3,
      summary: 'Dois dias com preletores convidados tratando de casamento, filhos, finanças do lar e restauração.',
      description: 'Dois dias inteiros dedicados à família. Palestras pela manhã, oficinas simultâneas à tarde e plenárias à noite.\n\nHá espaço kids com programação própria durante todas as sessões, e o almoço de sábado é servido no salão da igreja.',
      venueId: sede.id, local: 'Templo Sede — Padre Miguel/RJ', capacidade: 900,
      inicio: new Date(`${anoAtual}-11-13T19:00:00-03:00`), fim: new Date(`${anoAtual}-11-15T19:00:00-03:00`),
      status: 'INSCRICOES_ABERTAS' as const,
      destaques: ['Oficinas simultâneas por tema', 'Espaço kids com equipe treinada', 'Almoço de sábado incluso', 'Material impresso para cada casal'],
      lotes: [
        { slug: 'familias-casal', name: 'Casal', priceCents: 20000, audience: 'CASAL' as const, qtd: 300, meals: true, description: 'Duas credenciais + almoço de sábado.' },
        { slug: 'familias-individual', name: 'Individual', priceCents: 12000, audience: 'GERAL' as const, qtd: 300, meals: true, description: 'Uma credencial + almoço de sábado.' },
      ],
    },
    {
      slug: 'acampamento-kids', name: 'Acampamento Kids', category: 'ACAMPAMENTO' as const,
      tagline: 'De 6 a 12 anos', featured: false, order: 4,
      summary: 'Três dias de aventura, brincadeiras e ensino bíblico com equipe treinada.',
      description: 'Três dias pensados do começo ao fim para crianças de 6 a 12 anos. Equipe treinada, enfermeira no local, proporção de um monitor para cada seis crianças e comunicação diária com os pais.',
      venueId: guapimirim.id, local: 'Chácara Betel — Guapimirim/RJ', capacidade: 120,
      inicio: new Date(`${anoAtual + 1}-01-15T10:00:00-03:00`), fim: new Date(`${anoAtual + 1}-01-17T17:00:00-03:00`),
      status: 'INSCRICOES_EM_BREVE' as const,
      destaques: ['Um monitor para cada seis crianças', 'Enfermeira no local 24h', 'Transporte saindo do templo sede', 'Relatório diário para os pais'],
      lotes: [
        { slug: 'kids-unico', name: 'Inscrição', priceCents: 39000, audience: 'CRIANCA' as const, qtd: 120, lodging: true, meals: true, transport: true, description: 'Hospedagem, alimentação, transporte e material.' },
      ],
    },
    {
      slug: 'conferencia-de-lideres', name: 'Conferência de Líderes', category: 'CONFERENCIA' as const,
      tagline: 'Formação para quem serve', featured: false, order: 5,
      summary: 'Capacitação para líderes de células, ministérios e congregações.',
      description: 'Formação intensiva para quem já serve. Trilhas em teologia prática, cuidado pastoral, gestão de voluntários e comunicação. É requisito para assumir liderança de célula ou ministério na MEB.',
      venueId: sede.id, local: 'Templo Sede — Padre Miguel/RJ', capacidade: 300,
      inicio: new Date(`${anoAtual}-09-26T09:00:00-03:00`), fim: new Date(`${anoAtual}-09-27T18:00:00-03:00`),
      status: 'INSCRICOES_ABERTAS' as const,
      destaques: ['Quatro trilhas simultâneas', 'Certificado de participação', 'Coffee break e almoço inclusos'],
      lotes: [
        { slug: 'lideres-unico', name: 'Inscrição', priceCents: 8000, audience: 'GERAL' as const, qtd: 300, meals: true, description: 'Acesso a todas as trilhas + certificado.' },
      ],
    },
  ];

  for (const e of eventos) {
    const evento = await prisma.event.upsert({
      where: { slug: e.slug },
      create: {
        slug: e.slug, name: e.name, tagline: e.tagline, category: e.category,
        summary: e.summary, description: e.description, featured: e.featured, order: e.order,
      },
      update: { summary: e.summary, description: e.description },
    });

    const ano = e.inicio.getFullYear();
    const edicao = await prisma.eventEdition.upsert({
      where: { eventId_year: { eventId: evento.id, year: ano } },
      create: {
        eventId: evento.id,
        slug: `${e.slug}-${ano}`,
        year: ano,
        title: `${e.name} ${ano}`,
        theme: e.tagline,
        status: e.status,
        startsAt: e.inicio,
        endsAt: e.fim,
        registrationOpensAt: new Date(e.inicio.getTime() - 120 * 86_400_000),
        registrationClosesAt: new Date(e.inicio.getTime() - 5 * 86_400_000),
        venueId: e.venueId ?? undefined,
        churchId: sedeIgreja.id,
        locationLabel: e.local,
        capacity: e.capacidade,
        highlights: e.destaques,
        installmentsMax: e.category === 'MISSAO' ? 12 : 6,
        refundPolicy: [
          { days: 45, percent: 100 }, { days: 30, percent: 80 },
          { days: 15, percent: 50 }, { days: 7, percent: 30 }, { days: 0, percent: 0 },
        ],
        publishedAt: new Date(),
      },
      update: { status: e.status },
    });

    for (const [i, lote] of e.lotes.entries()) {
      await prisma.ticketTier.upsert({
        where: { editionId_slug: { editionId: edicao.id, slug: lote.slug } },
        create: {
          editionId: edicao.id,
          slug: lote.slug,
          name: lote.name,
          description: lote.description,
          audience: lote.audience,
          priceCents: lote.priceCents,
          quantityTotal: lote.qtd,
          quantitySold: Math.floor(lote.qtd * (e.status === 'INSCRICOES_ABERTAS' ? 0.55 : 0)),
          includesLodging: lote.lodging ?? false,
          includesMeals: lote.meals ?? false,
          includesTransport: lote.transport ?? false,
          maxPerOrder: lote.audience === 'CASAL' ? 2 : 6,
          order: i,
        },
        update: {},
      });
    }

    const vendidos = await prisma.ticketTier.aggregate({
      where: { editionId: edicao.id },
      _sum: { quantitySold: true },
    });
    await prisma.eventEdition.update({
      where: { id: edicao.id },
      data: { soldCount: vendidos._sum.quantitySold ?? 0 },
    });

    // Edições anteriores (memória do evento)
    for (const delta of [1, 2, 3]) {
      const anoAnterior = ano - delta;
      await prisma.eventEdition.upsert({
        where: { eventId_year: { eventId: evento.id, year: anoAnterior } },
        create: {
          eventId: evento.id,
          slug: `${e.slug}-${anoAnterior}`,
          year: anoAnterior,
          title: `${e.name} ${anoAnterior}`,
          status: 'REALIZADO',
          startsAt: new Date(e.inicio.getTime() - delta * 365 * 86_400_000),
          endsAt: new Date(e.fim.getTime() - delta * 365 * 86_400_000),
          venueId: e.venueId ?? undefined,
          locationLabel: e.local,
          capacity: e.capacidade,
          soldCount: e.capacidade,
          publishedAt: new Date(),
        },
        update: {},
      });
    }
  }
  console.log(`✓ ${eventos.length} eventos com lotes e edições anteriores`);

  /* ---------------- Carrossel ---------------- */
  const slides = [
    { title: 'Venha celebrar conosco', eyebrow: 'Domingo · 18h30', badge: 'Culto de Celebração', subtitle: 'Um culto de adoração, palavra e comunhão para toda a família. Chegue 15 minutos antes — nossa equipe estará na porta te esperando.', imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=80', ctaLabel: 'Ver a programação', ctaHref: '/cultos', secondaryLabel: 'Como chegar', secondaryHref: '/#mapa', order: 0 },
    { title: 'MEB Jovens: sua geração tem lugar aqui', eyebrow: 'Sexta-feira · 20h', badge: 'Juventude', subtitle: 'Louvor, mensagem e amizade de verdade. Se você tem entre 15 e 30 anos, essa noite foi feita pra você.', imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1920&q=80', ctaLabel: 'Conhecer o MEB Jovens', ctaHref: '/ministerios', secondaryLabel: 'Ver eventos', secondaryHref: '/eventos', order: 1 },
    { title: 'Ninguém carrega o peso sozinho', eyebrow: 'Terça-feira · 19h30', badge: 'Culto de Oração', subtitle: 'Culto de oração e libertação. Traga seu pedido — e, se preferir, escreva anonimamente no nosso mural.', imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1920&q=80', ctaLabel: 'Escrever no mural', ctaHref: '/mural', secondaryLabel: 'Pedidos de oração', secondaryHref: '/mural', order: 2 },
    { title: 'Do Rio de Janeiro para o mundo', eyebrow: 'O ano todo', badge: 'Missões', subtitle: 'Já enviamos equipes a seis países. Conheça os campos missionários que a MEB sustenta.', imageUrl: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1920&q=80', ctaLabel: 'Ver campos missionários', ctaHref: '/eventos', secondaryLabel: 'Sobre a igreja', secondaryHref: '/sobre', order: 3 },
  ];
  for (const slide of slides) {
    const existente = await prisma.heroSlide.findFirst({ where: { title: slide.title } });
    if (!existente) await prisma.heroSlide.create({ data: slide });
  }
  console.log(`✓ ${slides.length} slides no carrossel da home`);

  /* ---------------- Mural ---------------- */
  const pedidos = [
    { category: 'SAUDE' as const, body: 'Minha mãe entrou na fila do transplante essa semana. Ela está firme na fé, mas eu confesso que estou com medo. Peço que orem por um doador compatível e por paz na nossa casa enquanto esperamos.', prayerCount: 247, urgent: false },
    { category: 'TRABALHO_E_PROVISAO' as const, body: 'Fui demitido depois de onze anos na mesma empresa. Tenho três filhos e o aluguel vence dia 10. Não sei o que fazer, mas sei que Deus não me abandonou até aqui.', prayerCount: 389, urgent: true },
    { category: 'GRATIDAO' as const, title: 'Ele respondeu!', body: 'Há três meses pedi oração aqui pelo meu casamento. Hoje voltei só para dizer: estamos em aconselhamento, dormindo no mesmo quarto de novo e rindo juntos. Obrigado a cada um que orou.', prayerCount: 512, urgent: false, respondido: true },
    { category: 'FAMILIA' as const, body: 'Meu filho de 17 anos se afastou da igreja e das nossas conversas. Não quero forçar nada, só quero que o coração dele volte a se abrir. Orem por sabedoria pra eu saber a hora de falar e a hora de calar.', prayerCount: 168, urgent: false },
    { category: 'ESPIRITUAL' as const, body: 'Faz meses que oro e sinto o céu de bronze. Continuo vindo aos cultos, continuo lendo a Palavra, mas está seco. Preciso que alguém ore por mim porque hoje eu não consigo.', prayerCount: 301, urgent: false },
    { category: 'ESTUDOS' as const, body: 'Faço ENEM em novembro e é minha terceira tentativa. Trabalho o dia inteiro e estudo de madrugada. Peço oração por foco, saúde e por uma vaga em enfermagem.', prayerCount: 94, urgent: false },
    { category: 'LUTO' as const, body: 'Perdi meu pai em julho. Todo mundo já voltou à vida normal e eu ainda travo no supermercado quando vejo o café que ele tomava. Só queria que alguém orasse por mim hoje.', prayerCount: 276, urgent: false },
    { category: 'RELACIONAMENTOS' as const, body: 'Briguei feio com minha irmã e faz dois anos que a gente não se fala. O orgulho é grande dos dois lados. Preciso de coragem pra dar o primeiro passo.', prayerCount: 143, urgent: false },
  ];

  for (const [i, p] of pedidos.entries()) {
    const existente = await prisma.prayerRequest.findFirst({ where: { body: p.body } });
    if (existente) continue;
    await prisma.prayerRequest.create({
      data: {
        category: p.category,
        title: p.title,
        body: p.body,
        anonymous: true,
        status: p.respondido ? 'RESPONDIDO' : 'PUBLICADO',
        prayerCount: p.prayerCount,
        urgent: p.urgent,
        publishedAt: new Date(Date.now() - (i + 1) * 8 * 3_600_000),
        createdAt: new Date(Date.now() - (i + 1) * 8 * 3_600_000),
        expiresAt: new Date(Date.now() + 90 * 86_400_000),
      },
    });
  }
  console.log(`✓ ${pedidos.length} pedidos no mural de orações`);

  /* ---------------- Cupons ---------------- */
  await prisma.coupon.upsert({
    where: { code: 'MEBMEMBRO' },
    create: { code: 'MEBMEMBRO', label: 'Desconto para membros', percentOff: 10, perUserLimit: 1, active: true },
    update: {},
  });
  await prisma.coupon.upsert({
    where: { code: 'PRIMEIRAVEZ' },
    create: { code: 'PRIMEIRAVEZ', label: 'Boas-vindas', amountOffCents: 5000, minOrderCents: 20000, maxRedemptions: 200, active: true },
    update: {},
  });
  console.log('✓ 2 cupons de desconto');

  /* ---------------- Contadores ---------------- */
  const contadores = [
    { key: 'membros', label: 'Membros ativos', iconKey: 'users', order: 0 },
    { key: 'igrejas_oficiais', label: 'Igrejas oficiais', iconKey: 'church', order: 1 },
    { key: 'paises', label: 'Países alcançados', iconKey: 'globe', order: 2 },
    { key: 'oracoes_registradas', label: 'Orações intercedidas', iconKey: 'hands', order: 3 },
    { key: 'pedidos_de_oracao', label: 'Pedidos de oração', iconKey: 'heart', order: 4 },
    { key: 'inscricoes_confirmadas', label: 'Inscrições confirmadas', iconKey: 'ticket', order: 5 },
    { key: 'presencas_no_mes', label: 'Presenças no mês', iconKey: 'calendar', order: 6 },
  ];
  for (const c of contadores) {
    await prisma.statCounter.upsert({
      where: { key: c.key },
      create: { ...c, value: 0, source: 'auto' },
      update: { label: c.label, order: c.order },
    });
  }
  console.log(`✓ ${contadores.length} contadores públicos`);

  /* ---------------- Configurações ---------------- */
  await prisma.setting.upsert({
    where: { key: 'site' },
    create: {
      key: 'site',
      value: {
        versaoPrivacidade: '2026.1',
        muralAtivo: true,
        checkinAtivo: true,
        descontoPixBps: 500,
      },
    },
    update: {},
  });

  console.log('\n▸ Base pronta.');
  console.log('  Acesse /entrar com pastor@meb.org.br / Meb@2026');
  console.log('  Rode "npm run jobs:daily" para materializar os cultos da semana.\n');
}

main()
  .catch((e) => {
    console.error('Falha ao semear a base:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
