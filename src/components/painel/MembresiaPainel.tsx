'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, UserCheck, Clock, Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

type Pessoa = { id: string; publicId: string; nome: string; email: string; presencas: number; desde: string };

export function MembresiaPainel({
  minimo,
  janela,
  pendentes,
  frequentadores,
}: {
  minimo: number;
  janela: number;
  pendentes: Pessoa[];
  frequentadores: Pessoa[];
}) {
  const [lista, setLista] = useState(pendentes);
  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const decidir = async (pessoa: Pessoa, aprovar: boolean) => {
    setProcessando(pessoa.id);
    setMensagem(null);
    try {
      const res = await fetch('/api/membresia/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pessoa.id, aprovar }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setMensagem(dados.erro ?? 'Não foi possível concluir.');
        return;
      }
      setLista((l) => l.filter((p) => p.id !== pessoa.id));
      setMensagem(
        aprovar
          ? `${pessoa.nome} agora é membro oficial. O contador da home já foi atualizado.`
          : `${pessoa.nome} voltou para frequentador.`,
      );
    } catch {
      setMensagem('Falha de conexão. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="space-y-8">
      {mensagem ? (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-olive-400/40 bg-olive-500/10 p-4 text-[14px] text-olive-700"
        >
          {mensagem}
        </motion.p>
      ) : null}

      <section>
        <h2 className="flex items-center gap-2 font-display text-xl text-ink-900">
          <UserCheck className="h-5 w-5 text-crimson-700" />
          Aguardando confirmação
          {lista.length ? (
            <span className="rounded-full bg-crimson-700 px-2.5 py-0.5 text-[12px] font-bold text-white">{lista.length}</span>
          ) : null}
        </h2>

        {lista.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-[14px] text-ink-400">
            Nenhum cadastro aguardando confirmação no momento.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            <AnimatePresence>
              {lista.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-sheen font-display text-base font-semibold text-gold-950">
                    {p.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight text-ink-900">{p.nome}</p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-400">{p.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="flex items-center gap-1.5 font-semibold text-olive-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {p.presencas} presenças em {janela} dias
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-400">
                        <Clock className="h-3.5 w-3.5" />
                        Cadastrado em {formatDate(p.desde, 'curta')}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decidir(p, false)}
                      disabled={processando === p.id}
                      className="btn-outline !px-4 !py-2.5 text-[13px]"
                    >
                      <X className="h-4 w-4" /> Ainda não
                    </button>
                    <button
                      onClick={() => decidir(p, true)}
                      disabled={processando === p.id}
                      className="btn-primary !px-4 !py-2.5 text-[13px]"
                    >
                      {processando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Confirmar membresia
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl text-ink-900">Frequentadores a caminho</h2>
        <p className="mt-2 text-[14px] text-ink-500">
          Já vieram mais de uma vez nos últimos {janela} dias. Faltam poucas presenças para o gatilho.
        </p>

        {frequentadores.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-[14px] text-ink-400">
            Nenhum frequentador registrado no período.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {frequentadores.map((p) => {
              const progresso = Math.min(100, Math.round((p.presencas / minimo) * 100));
              return (
                <li key={p.id} className="card flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-ink-900">{p.nome}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', progresso >= 80 ? 'bg-olive-500' : 'bg-gold-sheen')}
                        style={{ width: `${Math.max(6, progresso)}%` }}
                      />
                    </div>
                  </div>
                  <span className="tabular shrink-0 text-[13px] font-semibold text-ink-500">
                    {p.presencas}/{minimo}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
