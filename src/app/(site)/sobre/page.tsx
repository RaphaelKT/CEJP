import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, BookOpenText, Church, Compass, Globe2, HandHeart, HeartHandshake,
  Users2, Landmark, ShieldCheck, Sprout,
} from 'lucide-react';
import { Ornament, SectionHeading } from '@/components/ui/Section';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { IGREJA } from '@/lib/site/config';
import { GALERIA_DEMO } from '@/lib/site/media-demo';

export const metadata: Metadata = {
  title: 'Sobre nós',
  description:
    'Conheça a história da Missão Evangélica do Brasil: de uma garagem em Padre Miguel a congregações no Rio e missionários em seis países.',
};

const LINHA_DO_TEMPO = [
  {
    ano: '1987',
    titulo: 'Doze pessoas numa garagem',
    texto:
      'O pastor Jonas Ribeiro e sua esposa Marlene abrem a garagem de casa, na Estrada da Água Branca, para o primeiro culto. Havia doze pessoas, um violão desafinado e uma Bíblia emprestada.',
  },
  {
    ano: '1991',
    titulo: 'O primeiro templo',
    texto:
      'Com a garagem lotada, a igreja compra um terreno a duzentos metros dali. O templo foi levantado em mutirão — muitos dos tijolos foram assentados pelos próprios membros aos domingos à tarde.',
  },
  {
    ano: '1998',
    titulo: 'Nasce o Retiro de Carnaval',
    texto:
      'Trinta irmãos sobem a serra numa casa alugada em Teresópolis, fugindo do barulho e buscando a presença de Deus. A tradição nunca mais parou.',
  },
  {
    ano: '2004',
    titulo: 'As primeiras congregações',
    texto:
      'Bangu, Realengo e Campo Grande recebem congregações filhas. O modelo passa a ser o de uma igreja em muitos endereços, com a mesma doutrina e o mesmo cuidado.',
  },
  {
    ano: '2011',
    titulo: 'Do Rio para o mundo',
    texto:
      'A MEB envia seu primeiro casal missionário para Moçambique. Hoje são seis países com obra permanente sustentada pela igreja.',
  },
  {
    ano: '2016',
    titulo: 'JUMEB toma forma',
    texto:
      'A juventude ganha seu próprio encontro anual. A primeira edição reuniu 320 jovens; hoje passa de mil e oitocentos.',
  },
  {
    ano: '2023',
    titulo: 'Ampliação do templo sede',
    texto:
      'O santuário é ampliado para 1.800 lugares, com acessibilidade completa, estúdio de transmissão e salas próprias para o ministério infantil.',
  },
  {
    ano: 'Hoje',
    titulo: 'Uma família que continua crescendo',
    texto:
      'Cultos todos os dias da semana, células nos bairros, ações sociais permanentes e uma porta que continua aberta para quem chega pela primeira vez.',
  },
];

const VALORES = [
  { Icon: BookOpenText, titulo: 'Fidelidade à Palavra', texto: 'A Bíblia é nossa única regra de fé e prática. Pregação expositiva, sem atalhos e sem sensacionalismo.' },
  { Icon: HeartHandshake, titulo: 'Acolhimento radical', texto: 'Ninguém precisa estar arrumado para entrar. A transformação acontece dentro, não na porta.' },
  { Icon: Globe2, titulo: 'Paixão missionária', texto: 'Toda igreja local existe para alcançar além de si mesma — do bairro ao outro lado do mundo.' },
  { Icon: HandHeart, titulo: 'Cuidado integral', texto: 'Aconselhamento, apoio material e presença nas horas difíceis. Fé que não toca a vida real não serve.' },
  { Icon: ShieldCheck, titulo: 'Transparência', texto: 'Prestação de contas trimestral publicada e auditoria externa anual. Ofertas são responsabilidade sagrada.' },
  { Icon: Sprout, titulo: 'Formação de líderes', texto: 'Discipulado intencional. Todo membro é potencial líder e todo líder forma outros.' },
];

const LIDERANCA = [
  { nome: 'Pr. Jonas Ribeiro', cargo: 'Pastor presidente', desde: 'Desde 1987', bio: 'Fundador da MEB. Formado em Teologia pelo STBSB, casado com Marlene há 42 anos, pai de três e avô de sete.' },
  { nome: 'Pra. Marlene Ribeiro', cargo: 'Ministério de mulheres e aconselhamento', desde: 'Desde 1987', bio: 'Psicopedagoga e conselheira cristã. Coordena o acolhimento e o atendimento às famílias.' },
  { nome: 'Pr. Daniel Ferraz', cargo: 'Pastor de juventude', desde: 'Desde 2009', bio: 'Idealizador do JUMEB. Lidera a formação de líderes de célula entre os jovens.' },
  { nome: 'Pr. Márcio Salles', cargo: 'Missões e plantação de igrejas', desde: 'Desde 2011', bio: 'Coordena os campos em Moçambique, Paraguai e Nepal e o preparo dos enviados.' },
  { nome: 'Diác. Cláudia Nunes', cargo: 'Ação social', desde: 'Desde 2005', bio: 'Responsável pelo banco de alimentos, cursos profissionalizantes e apoio jurídico gratuito.' },
  { nome: 'Presb. Ricardo Alves', cargo: 'Administração e transparência', desde: 'Desde 1998', bio: 'Contador. Cuida da prestação de contas e da conformidade da igreja.' },
];

const CREDO = [
  'Cremos na Bíblia Sagrada como Palavra de Deus inspirada, infalível e suficiente para fé e prática.',
  'Cremos em um só Deus, eternamente existente em três pessoas: Pai, Filho e Espírito Santo.',
  'Cremos na divindade de Jesus Cristo, em seu nascimento virginal, morte vicária, ressurreição corporal e volta pessoal.',
  'Cremos na salvação pela graça, mediante a fé, e não por obras — dom de Deus a quem crê.',
  'Cremos na obra do Espírito Santo que regenera, habita, capacita e santifica o crente.',
  'Cremos na Igreja como corpo de Cristo, chamada a adorar, discipular, servir e evangelizar.',
];

export default function SobrePage() {
  const anos = new Date().getFullYear() - IGREJA.fundacao;

  return (
    <>
      {/* ---------- Capa ---------- */}
      <section className="relative flex min-h-[68svh] items-end overflow-hidden bg-ink-950 pb-16 pt-[var(--header-h)]">
        <Image src={GALERIA_DEMO[6]!} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="container relative">
          <p className="eyebrow mb-4 !text-gold-400">Sobre nós</p>
          <h1 className="max-w-4xl text-display text-ivory-50 text-shadow-hero">
            {anos} anos entre a garagem e o <span className="text-gold-foil">mundo</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory-200/80">
            Uma igreja nasce quando alguém acredita que o bairro pode ser diferente. A nossa nasceu
            assim — e nunca deixou de ser um lugar onde se sabe o seu nome.
          </p>
        </div>
      </section>

      {/* ---------- Como começou ---------- */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
            <Reveal>
              <p className="eyebrow mb-4">Como tudo começou</p>
              <h2 className="text-headline text-ink-900">
                Uma garagem em Padre Miguel, um violão e doze pessoas
              </h2>
              <div className="mt-7 space-y-5 text-[16.5px] leading-relaxed text-ink-600">
                <p>
                  No inverno de {IGREJA.fundacao}, o pastor Jonas Ribeiro trabalhava como torneiro
                  mecânico e pregava aos domingos. A esposa, Marlene, ensinava numa escola municipal
                  do bairro. Não havia templo, denominação de apoio nem dinheiro — havia uma garagem
                  com portão levantado e cadeiras de plástico emprestadas.
                </p>
                <p>
                  A primeira reunião teve doze pessoas: o casal, os três filhos, dois vizinhos e cinco
                  colegas da fábrica. O culto começou às 19h e terminou perto das 22h, porque
                  ninguém queria ir embora.
                </p>
                <p>
                  Em quatro anos a garagem já não cabia. A igreja comprou um terreno a duzentos metros
                  e ergueu o primeiro templo em mutirão — muitos tijolos foram assentados pelos
                  próprios membros nas tardes de domingo, depois do culto.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="ring-foil relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] shadow-lift">
                  <Image src={GALERIA_DEMO[4]!} alt="Congregação reunida" fill sizes="(max-width:1024px) 45vw, 28vw" className="object-cover" />
                </div>
                <div className="relative mt-10 aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] shadow-soft">
                  <Image src={GALERIA_DEMO[5]!} alt="Momento de oração" fill sizes="(max-width:1024px) 45vw, 28vw" className="object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Linha do tempo ---------- */}
      <section className="section relative overflow-hidden bg-ivory-veil">
        <div className="container">
          <SectionHeading
            eyebrow="Nossa trajetória"
            title={<>Marcos que nos <span className="text-gold-foil">trouxeram até aqui</span></>}
            align="center"
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-gold-400 via-gold-300 to-transparent sm:left-1/2" aria-hidden />

            <ol className="space-y-10">
              {LINHA_DO_TEMPO.map((item, i) => (
                <Reveal as="li" key={item.ano} delay={i * 0.05} className="relative pl-12 sm:pl-0">
                  <div className={`sm:flex sm:items-start sm:gap-8 ${i % 2 === 0 ? '' : 'sm:flex-row-reverse'}`}>
                    <div className={`sm:w-1/2 ${i % 2 === 0 ? 'sm:text-right' : ''}`}>
                      <span className="inline-block rounded-full bg-crimson-deep px-3.5 py-1 font-display text-sm font-semibold text-gold-200">
                        {item.ano}
                      </span>
                      <h3 className="mt-3 font-display text-xl text-ink-900">{item.titulo}</h3>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">{item.texto}</p>
                    </div>
                    <div className="hidden sm:block sm:w-1/2" />
                  </div>
                  <span className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-full border-2 border-gold-500 bg-ivory-50 sm:left-1/2 sm:-translate-x-1/2" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-crimson-700" />
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Como funcionamos hoje ---------- */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="A igreja hoje"
            title={<>Como a MEB <span className="text-gold-foil">funciona</span></>}
            description="Somos uma igreja em muitos endereços, com governo colegiado, doutrina única e autonomia pastoral em cada congregação."
          />

          <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Church, titulo: 'Templo sede e congregações', texto: 'A sede em Padre Miguel concentra a formação e a administração. Cada congregação tem pastor local e conselho próprio.' },
              { Icon: Users2, titulo: 'Células nos bairros', texto: 'Grupos de 8 a 15 pessoas que se reúnem em casas durante a semana. É onde o cuidado acontece de perto.' },
              { Icon: Landmark, titulo: 'Governo colegiado', texto: 'Conselho de presbíteros e diáconos, com assembleia anual de membros e prestação de contas pública.' },
              { Icon: Compass, titulo: 'Membresia com propósito', texto: 'A membresia é reconhecida pela frequência e pelo vínculo real com a comunidade — não por formulário.' },
            ].map(({ Icon, titulo, texto }) => (
              <RevealItem key={titulo}>
                <article className="card h-full p-7">
                  <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 text-gold-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg text-ink-900">{titulo}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{texto}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-12 rounded-[var(--radius-card)] border border-gold-200 bg-gold-50/50 p-8">
            <h3 className="font-display text-xl text-ink-900">Como alguém se torna membro</h3>
            <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-ink-600">
              Na MEB, membresia não é um cadastro — é o reconhecimento de um vínculo que já existe. Quem
              cria conta no site entra como <strong>visitante</strong>. A presença é registrada a cada
              culto pelo QR do totem. Ao completar <strong>cinco presenças confirmadas em trinta
              dias</strong>, o sistema aciona a secretaria, que conversa com a pessoa e confirma a
              membresia. Só então a matrícula é emitida e o número de membros da igreja sobe.
            </p>
            <Link href="/cadastro" className="btn-primary group mt-6">
              Criar minha conta
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Valores ---------- */}
      <section className="section bg-ivory-veil">
        <div className="container">
          <SectionHeading eyebrow="No que acreditamos" title={<>Seis convicções <span className="text-gold-foil">inegociáveis</span></>} align="center" />
          <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {VALORES.map(({ Icon, titulo, texto }) => (
              <RevealItem key={titulo}>
                <article className="card card-hover h-full p-7">
                  <Icon className="mb-5 h-6 w-6 text-crimson-700" />
                  <h3 className="font-display text-lg text-ink-900">{titulo}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{texto}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------- Declaração de fé ---------- */}
      <section id="fe" className="section scroll-mt-24 bg-crimson-deep">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Ornament className="mb-8" />
            <h2 className="text-center text-headline text-ivory-50">Declaração de fé</h2>
            <ol className="mt-10 space-y-5">
              {CREDO.map((linha, i) => (
                <Reveal as="li" key={linha} delay={i * 0.06} className="flex gap-4 rounded-2xl border border-ivory-50/10 bg-ivory-50/[0.04] p-5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400/15 font-display text-sm font-semibold text-gold-300">
                    {i + 1}
                  </span>
                  <p className="text-[15.5px] leading-relaxed text-ivory-200/85">{linha}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Liderança ---------- */}
      <section id="lideranca" className="section scroll-mt-24 bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Quem caminha à frente"
            title={<>Nossa <span className="text-gold-foil">liderança</span></>}
            description="Pessoas reais, com telefone que atende e porta que abre. Se você precisa conversar, procure qualquer um deles."
          />
          <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {LIDERANCA.map((p) => (
              <RevealItem key={p.nome}>
                <article className="card card-hover h-full p-7">
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-sheen font-display text-lg font-semibold text-gold-950">
                      {p.nome.split(' ').slice(-2).map((n) => n[0]).join('')}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg leading-tight text-ink-900">{p.nome}</h3>
                      <p className="mt-1 text-[13px] font-semibold uppercase tracking-wider text-crimson-700">{p.cargo}</p>
                      <p className="mt-0.5 text-[12.5px] text-ink-400">{p.desde}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-[14.5px] leading-relaxed text-ink-500">{p.bio}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------- Chamada final ---------- */}
      <section className="relative overflow-hidden bg-ivory-100 py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Ornament className="mb-8" />
            <h2 className="text-headline text-ink-900">
              A história continua — e tem <span className="text-gold-foil">espaço para você</span>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-600">
              Venha num domingo. Sente no fundo se preferir. Só não vá embora sem falar com alguém.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/cultos" className="btn-primary">Ver a programação</Link>
              <Link href="/#mapa" className="btn-outline">Como chegar</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
