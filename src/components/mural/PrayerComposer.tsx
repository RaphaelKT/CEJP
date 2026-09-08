'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenLine, Lock, Send, CheckCircle2, AlertCircle, LifeBuoy, X } from 'lucide-react';
import { CATEGORIAS } from '@/lib/prayer-ui';
import { cn } from '@/lib/utils/cn';

const LIMITE = 1200;

/**
 * Compositor do mural.
 *
 * Decisões de produto embutidas na UI:
 *  - anônimo é o padrão (o botão de identificar-se é opt-in explícito);
 *  - o contador de caracteres só aparece depois de 60% do limite;
 *  - a resposta do servidor pode trazer um bloco de acolhimento quando o
 *    texto sinaliza crise — nesse caso ele domina a tela.
 */
export function PrayerComposer({ onCriado, autenticadoComo }: { onCriado?: () => void; autenticadoComo?: string | null }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('OUTRO');
  const [anonimo, setAnonimo] = useState(true);
  const [urgente, setUrgente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ emRevisao: boolean; acolhimento: { titulo: string; corpo: string; telefone: string } | null } | null>(null);
  const [enviando, iniciar] = useTransition();

  const restante = LIMITE - texto.length;
  const mostrarContador = texto.length > LIMITE * 0.6;

  const enviar = () => {
    setErro(null);
    iniciar(async () => {
      try {
        const res = await fetch('/api/mural', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: texto, category: categoria, anonymous: anonimo, urgent: urgente }),
        });
        const dados = await res.json();
        if (!res.ok) {
          setErro(dados.erro ?? 'Não foi possível publicar agora. Tente novamente em instantes.');
          return;
        }
        setSucesso({ emRevisao: Boolean(dados.emRevisao), acolhimento: dados.acolhimento ?? null });
        setTexto('');
        setUrgente(false);
        onCriado?.();
      } catch {
        setErro('Sem conexão com o servidor. Verifique sua internet e tente de novo.');
      }
    });
  };

  if (sucesso) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ring-foil relative overflow-hidden rounded-[22px] bg-white p-8 text-center shadow-lift"
      >
        {sucesso.acolhimento ? (
          <>
            <LifeBuoy className="mx-auto mb-4 h-12 w-12 text-crimson-600" />
            <h3 className="font-display text-2xl text-ink-900">{sucesso.acolhimento.titulo}</h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">
              {sucesso.acolhimento.corpo}
            </p>
            <a href={`tel:${sucesso.acolhimento.telefone}`} className="btn-primary mt-6">
              Ligar para o CVV — {sucesso.acolhimento.telefone}
            </a>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-olive-500" />
            <h3 className="font-display text-2xl text-ink-900">
              {sucesso.emRevisao ? 'Recebemos o seu pedido' : 'Seu pedido está no mural'}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">
              {sucesso.emRevisao
                ? 'Nossa equipe pastoral vai conferir e publicar em instantes. Você já está em nossas orações.'
                : 'A partir de agora, irmãos e irmãs vão orar por você. Você não está sozinho.'}
            </p>
          </>
        )}
        <button onClick={() => setSucesso(null)} className="btn-ghost mt-6 text-[13.5px]">
          Escrever outro pedido
        </button>
      </motion.div>
    );
  }

  return (
    <div className="ring-foil relative overflow-hidden rounded-[22px] bg-white shadow-lift">
      <AnimatePresence initial={false} mode="wait">
        {!aberto ? (
          <motion.button
            key="fechado"
            onClick={() => setAberto(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="group flex w-full items-center gap-4 p-6 text-left transition-colors hover:bg-ivory-100/50"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-crimson-deep text-ivory-50 shadow-crimson transition-transform duration-500 group-hover:scale-105">
              <PenLine className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg text-ink-900">
                O que está pesando no seu coração hoje?
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-400">
                Escreva anonimamente. A igreja inteira vai orar com você.
              </span>
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="aberto"
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl text-ink-900">Compartilhe seu pedido</h3>
                <p className="mt-1 text-[13.5px] text-ink-400">
                  Ninguém aqui julga. Escreva com suas palavras.
                </p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
                rows={6}
                autoFocus
                placeholder="Estou passando por…"
                className="field resize-none text-[15.5px] leading-relaxed"
                aria-label="Seu pedido de oração"
              />
              {mostrarContador ? (
                <span
                  className={cn(
                    'tabular absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[11.5px] font-medium',
                    restante < 60 ? 'text-crimson-600' : 'text-ink-300',
                  )}
                >
                  {restante}
                </span>
              ) : null}
            </div>

            <fieldset className="mt-5">
              <legend className="label">Sobre o quê?</legend>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.valor}
                    type="button"
                    onClick={() => setCategoria(c.valor)}
                    aria-pressed={categoria === c.valor}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300',
                      categoria === c.valor
                        ? 'border-crimson-600 bg-crimson-50 text-crimson-700'
                        : 'border-ink-200 text-ink-500 hover:border-gold-300 hover:bg-gold-50/50',
                    )}
                  >
                    <span className="mr-1" aria-hidden>
                      {c.emoji}
                    </span>
                    {c.rotulo}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 space-y-3 rounded-2xl bg-ivory-100 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={anonimo}
                  onChange={(e) => setAnonimo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700"
                />
                <span className="text-[13.5px] text-ink-600">
                  <strong className="flex items-center gap-1.5 font-semibold text-ink-900">
                    <Lock className="h-3.5 w-3.5" /> Publicar anonimamente
                  </strong>
                  {anonimo
                    ? 'Nem a equipe pastoral verá quem escreveu.'
                    : autenticadoComo
                      ? `Seu nome aparecerá como "${autenticadoComo}".`
                      : 'Você precisa estar logado para assinar o pedido.'}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={urgente}
                  onChange={(e) => setUrgente(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700"
                />
                <span className="text-[13.5px] text-ink-600">
                  <strong className="block font-semibold text-ink-900">É urgente</strong>
                  A equipe pastoral é notificada e o pedido sobe para o topo do mural.
                </span>
              </label>
            </div>

            {erro ? (
              <p className="error-text mt-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {erro}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[12px] leading-snug text-ink-300">
                Telefones e e-mails são removidos automaticamente para proteger você.
              </p>
              <button
                onClick={enviar}
                disabled={enviando || texto.trim().length < 15}
                className="btn-primary shrink-0"
              >
                {enviando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory-50/40 border-t-ivory-50" />
                    Publicando…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publicar pedido
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
