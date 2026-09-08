'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, EyeOff, LifeBuoy, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Caso = {
  id: string;
  motivo: string;
  escalado: boolean;
  criadoEm: string;
  sinais: { motivos?: string[]; score?: number } | null;
  pedido: { publicId: string; texto: string; categoria: string; urgente: boolean } | null;
  entidade: string;
};

export function ModeracaoLista({ casos }: { casos: Caso[] }) {
  const [lista, setLista] = useState(casos);
  const [processando, setProcessando] = useState<string | null>(null);

  const decidir = async (caso: Caso, aprovar: boolean) => {
    setProcessando(caso.id);
    try {
      const res = await fetch('/api/moderacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoId: caso.id, aprovar }),
      });
      if (res.ok) setLista((l) => l.filter((c) => c.id !== caso.id));
    } finally {
      setProcessando(null);
    }
  };

  if (!lista.length) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-olive-500" />
        <p className="font-display text-xl text-ink-900">Fila vazia</p>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-400">
          Nada aguardando decisão. A triagem automática está dando conta.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      <AnimatePresence>
        {lista.map((caso) => (
          <motion.li
            key={caso.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className={cn('card p-6', caso.escalado && 'border-crimson-400/60 bg-crimson-50/30')}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {caso.escalado ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson-700 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-white">
                  <LifeBuoy className="h-3 w-3" /> Risco à vida — contatar hoje
                </span>
              ) : null}
              <span className="rounded-full bg-ivory-200 px-3 py-1 text-[12px] font-medium text-ink-600">
                {caso.entidade === 'prayer_request' ? 'Pedido de oração' : 'Lote de fotos'}
              </span>
              <span className="text-[12px] text-ink-300">{caso.criadoEm}</span>
            </div>

            {caso.pedido ? (
              <blockquote className="rounded-xl bg-ivory-100 p-4 text-[14.5px] leading-relaxed text-ink-700">
                {caso.pedido.texto}
              </blockquote>
            ) : (
              <p className="text-[14px] text-ink-500">Motivo: {caso.motivo.replace(/_/g, ' ')}</p>
            )}

            {caso.sinais?.motivos?.length ? (
              <p className="mt-3 text-[12.5px] text-ink-400">
                Sinais detectados: {caso.sinais.motivos.join(', ')}
                {typeof caso.sinais.score === 'number' ? ` · risco ${(caso.sinais.score * 100).toFixed(0)}%` : ''}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => decidir(caso, true)} disabled={processando === caso.id} className="btn-primary !px-4 !py-2.5 text-[13px]">
                {processando === caso.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Publicar no mural
              </button>
              <button onClick={() => decidir(caso, false)} disabled={processando === caso.id} className="btn-outline !px-4 !py-2.5 text-[13px]">
                <EyeOff className="h-4 w-4" /> Manter oculto
              </button>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
