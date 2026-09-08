'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { Users, Church, Globe2, HeartHandshake, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type Contador = {
  key: string;
  label: string;
  iconKey: string;
  value: number;
  previousValue: number;
};

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  church: Church,
  globe: Globe2,
  hands: HeartHandshake,
  heart: HeartHandshake,
};

/**
 * Contadores institucionais da home.
 *
 * Dois comportamentos distintos e complementares:
 *  1. Ao entrar na viewport, cada número sobe de 0 até o valor atual.
 *  2. Depois disso, um stream SSE (`/api/tempo-real`) empurra qualquer
 *     mudança do banco — o número anima do valor antigo para o novo e um
 *     selo de variação aparece por alguns segundos.
 */
export function LiveStats({ iniciais }: { iniciais: Contador[] }) {
  const [contadores, setContadores] = useState(iniciais);
  const [variacoes, setVariacoes] = useState<Record<string, number>>({});

  useEffect(() => {
    let fonte: EventSource | null = null;
    let tentativas = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const conectar = () => {
      fonte = new EventSource('/api/tempo-real?canais=contadores');

      fonte.addEventListener('contadores', (evento) => {
        try {
          const { dados } = JSON.parse((evento as MessageEvent).data) as {
            dados: { key: string; value: number; previousValue: number }[];
          };
          setContadores((atuais) =>
            atuais.map((c) => {
              const novo = dados.find((d) => d.key === c.key);
              if (!novo) return c;
              setVariacoes((v) => ({ ...v, [c.key]: novo.value - c.value }));
              setTimeout(() => setVariacoes((v) => ({ ...v, [c.key]: 0 })), 6000);
              return { ...c, previousValue: c.value, value: novo.value };
            }),
          );
        } catch {
          /* payload malformado — ignora */
        }
      });

      fonte.onerror = () => {
        fonte?.close();
        // Backoff exponencial com teto de 30s.
        tentativas += 1;
        timeout = setTimeout(conectar, Math.min(30_000, 1000 * 2 ** tentativas));
      };
      fonte.onopen = () => {
        tentativas = 0;
      };
    };

    conectar();
    return () => {
      fonte?.close();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <section className="relative border-y border-ink-100 bg-ivory-100/70">
      <div className="container">
        <dl className="grid divide-y divide-ink-100 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {contadores.map((c, i) => (
            <StatCard key={c.key} contador={c} variacao={variacoes[c.key] ?? 0} indice={i} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function StatCard({ contador, variacao, indice }: { contador: Contador; variacao: number; indice: number }) {
  const Icone = ICONES[contador.iconKey] ?? Users;
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useInView(ref, { once: true, margin: '-60px' });
  const reduzir = useReducedMotion();
  const [exibido, setExibido] = useState(reduzir ? contador.value : 0);
  const anterior = useRef(0);

  useEffect(() => {
    if (!visivel) return;
    if (reduzir) {
      setExibido(contador.value);
      anterior.current = contador.value;
      return;
    }
    const controls = animate(anterior.current, contador.value, {
      duration: Math.min(2.2, 0.9 + Math.log10(Math.max(10, contador.value)) * 0.35),
      delay: anterior.current === 0 ? indice * 0.12 : 0,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setExibido(Math.round(v)),
      onComplete: () => {
        anterior.current = contador.value;
      },
    });
    return () => controls.stop();
  }, [visivel, contador.value, indice, reduzir]);

  return (
    <div ref={ref} className="group relative px-6 py-12 text-center sm:px-8">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-gold-200 bg-white shadow-soft transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-gold-400 group-hover:shadow-gold">
        <Icone className="h-5 w-5 text-gold-600" />
      </div>

      <dd className="relative">
        <span className="tabular font-display text-[clamp(2.5rem,4.5vw,3.5rem)] font-semibold leading-none text-ink-900">
          {exibido.toLocaleString('pt-BR')}
        </span>
        {variacao !== 0 ? (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute -right-1 -top-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
              variacao > 0 ? 'bg-olive-500/12 text-olive-600' : 'bg-crimson-500/12 text-crimson-700',
            )}
          >
            {variacao > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {variacao > 0 ? '+' : ''}
            {variacao}
          </motion.span>
        ) : null}
      </dd>

      <dt className="mt-3 text-[13.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
        {contador.label}
      </dt>

      <span
        className="pointer-events-none absolute inset-x-8 bottom-6 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg,transparent,#C8992B,transparent)' }}
        aria-hidden
      />
    </div>
  );
}
