'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Clock3, HandHeart, Loader2, Bell } from 'lucide-react';
import { PrayerCard, type PedidoPublico } from './PrayerCard';
import { PrayerComposer } from './PrayerComposer';
import { CATEGORIAS } from '@/lib/prayer-ui';
import { cn } from '@/lib/utils/cn';

type Ordem = 'recentes' | 'mais_orados' | 'urgentes';

const ORDENS: { valor: Ordem; rotulo: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { valor: 'recentes', rotulo: 'Mais recentes', Icon: Clock3 },
  { valor: 'mais_orados', rotulo: 'Mais orados', Icon: HandHeart },
  { valor: 'urgentes', rotulo: 'Urgentes', Icon: Flame },
];

export function PrayerWall({
  iniciais,
  totalInicial,
  autenticadoComo,
}: {
  iniciais: PedidoPublico[];
  totalInicial: number;
  autenticadoComo?: string | null;
}) {
  const [pedidos, setPedidos] = useState(iniciais);
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(iniciais.at(-1)?.publicId ?? null);
  const [temMais, setTemMais] = useState(iniciais.length >= 12);
  const [carregando, setCarregando] = useState(false);
  const [novos, setNovos] = useState(0);
  const sentinela = useRef<HTMLDivElement>(null);

  const buscar = useCallback(
    async (opts: { reset?: boolean; cursorAtual?: string | null } = {}) => {
      setCarregando(true);
      try {
        const params = new URLSearchParams({ ordem, limite: '12' });
        if (categoria) params.set('categoria', categoria);
        if (!opts.reset && opts.cursorAtual) params.set('cursor', opts.cursorAtual);

        const res = await fetch(`/api/mural?${params}`, { cache: 'no-store' });
        if (!res.ok) return;
        const dados = (await res.json()) as { pedidos: PedidoPublico[]; temMais: boolean };

        setPedidos((atuais) => (opts.reset ? dados.pedidos : [...atuais, ...dados.pedidos]));
        setCursor(dados.pedidos.at(-1)?.publicId ?? null);
        setTemMais(dados.temMais);
      } finally {
        setCarregando(false);
      }
    },
    [ordem, categoria],
  );

  // Recarrega ao trocar filtro/ordenação
  const primeiroRender = useRef(true);
  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    void buscar({ reset: true });
  }, [buscar]);

  // Rolagem infinita
  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo || !temMais) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !carregando) void buscar({ cursorAtual: cursor });
      },
      { rootMargin: '600px' },
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [temMais, carregando, cursor, buscar]);

  // Novos pedidos em tempo real (não interrompem a leitura: viram um aviso)
  useEffect(() => {
    const fonte = new EventSource('/api/tempo-real?canais=mural');
    fonte.addEventListener('mural', (evento) => {
      try {
        const { dados } = JSON.parse((evento as MessageEvent).data) as { dados: { tipo: string } };
        if (dados.tipo === 'novo_pedido') setNovos((n) => n + 1);
      } catch {
        /* ignora */
      }
    });
    fonte.onerror = () => fonte.close();
    return () => fonte.close();
  }, []);

  const carregarNovos = () => {
    setNovos(0);
    setOrdem('recentes');
    void buscar({ reset: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div>
        <div className="mb-8">
          <PrayerComposer autenticadoComo={autenticadoComo} onCriado={() => void buscar({ reset: true })} />
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {ORDENS.map(({ valor, rotulo, Icon }) => (
              <button
                key={valor}
                onClick={() => setOrdem(valor)}
                aria-pressed={ordem === valor}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-300',
                  ordem === valor
                    ? 'bg-ink-900 text-ivory-50 shadow-soft'
                    : 'border border-ink-200 bg-white text-ink-600 hover:border-gold-300',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {rotulo}
              </button>
            ))}
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoria(null)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
                categoria === null ? 'border-crimson-600 bg-crimson-50 text-crimson-700' : 'border-ink-200 text-ink-500 hover:border-gold-300',
              )}
            >
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.valor}
                onClick={() => setCategoria(c.valor === categoria ? null : c.valor)}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
                  categoria === c.valor ? 'border-crimson-600 bg-crimson-50 text-crimson-700' : 'border-ink-200 text-ink-500 hover:border-gold-300',
                )}
              >
                <span className="mr-1" aria-hidden>
                  {c.emoji}
                </span>
                {c.rotulo}
              </button>
            ))}
          </div>
        </div>

        {pedidos.length === 0 && !carregando ? (
          <div className="rounded-[22px] border border-dashed border-ink-200 bg-white/60 p-14 text-center">
            <HandHeart className="mx-auto mb-4 h-10 w-10 text-gold-400" />
            <p className="font-display text-xl text-ink-900">Nenhum pedido por aqui ainda</p>
            <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-400">
              Seja o primeiro a compartilhar. O mural existe justamente para que ninguém carregue o
              peso sozinho.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-5 md:columns-2 [&>*]:mb-5">
            {pedidos.map((p, i) => (
              <PrayerCard key={p.publicId} pedido={p} indice={i} />
            ))}
          </div>
        )}

        <div ref={sentinela} className="h-10" />

        {carregando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : null}

        {!temMais && pedidos.length > 0 ? (
          <p className="py-8 text-center text-[13.5px] text-ink-300">
            Você chegou ao fim do mural. Obrigado por interceder. 🙏
          </p>
        ) : null}
      </div>

      {/* Coluna lateral */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
        <div className="card p-6">
          <p className="eyebrow mb-4">O mural em números</p>
          <dl className="space-y-4">
            <div>
              <dt className="text-[13px] text-ink-400">Pedidos compartilhados</dt>
              <dd className="tabular font-display text-3xl font-semibold text-ink-900">
                {totalInicial.toLocaleString('pt-BR')}
              </dd>
            </div>
          </dl>
          <div className="rule-foil my-5" />
          <p className="text-[13.5px] leading-relaxed text-ink-500">
            Cada “Estou orando” aqui é uma pessoa real levando o seu nome diante de Deus. Não é um
            like — é um compromisso.
          </p>
        </div>

        <div className="card mt-5 bg-crimson-deep p-6 text-ivory-100">
          <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            Precisa de ajuda agora?
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ivory-200/85">
            Nossa equipe pastoral atende por telefone e presencialmente. Você não precisa esperar o
            domingo.
          </p>
          <a href="/contato" className="btn-gold mt-5 w-full !py-2.5 text-[13.5px]">
            Falar com um pastor
          </a>
        </div>

        <div className="card mt-5 p-6">
          <p className="eyebrow mb-3">Como funciona</p>
          <ol className="space-y-3 text-[13.5px] text-ink-500">
            {[
              'Escreva seu pedido — anônimo por padrão.',
              'Irmãos leem e tocam em “Orar por isso”.',
              'Você recebe respostas de ânimo da comunidade.',
              'Quando Deus responder, volte e conte pra gente.',
            ].map((passo, i) => (
              <li key={passo} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-100 text-[11px] font-bold text-gold-800">
                  {i + 1}
                </span>
                {passo}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Aviso de novos pedidos */}
      <AnimatePresence>
        {novos > 0 ? (
          <motion.button
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onClick={carregarNovos}
            className="fixed left-1/2 top-[calc(var(--header-h)+16px)] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-semibold text-ivory-50 shadow-lift"
          >
            <Bell className="h-4 w-4 text-gold-400" />
            {novos === 1 ? '1 novo pedido' : `${novos} novos pedidos`}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
