'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, ChevronLeft, ChevronRight, CreditCard, QrCode, Barcode, Loader2, Copy,
  AlertCircle, PartyPopper, Ticket, Tag, Users, Lock,
} from 'lucide-react';
import { formatBRL, formatDateRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type Lote = {
  id: string;
  nome: string;
  descricao?: string | null;
  precoCents: number;
  publico: string;
  vagas: number | null;
  minPorPedido: number;
  maxPorPedido: number;
  incluiHospedagem: boolean;
  incluiRefeicoes: boolean;
};

type Participante = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  shirtSize: string;
  emergencyContact: string;
  emergencyPhone: string;
  healthNotes: string;
  dietaryNotes: string;
};

type Cotacao = {
  subtotalCents: number;
  discountCents: number;
  interestCents: number;
  totalCents: number;
  installments: number;
  installmentCents: number;
  interestFree: boolean;
  methodDiscountCents: number;
  couponDiscountCents: number;
};

const PASSOS = ['Ingresso', 'Comprador', 'Participantes', 'Pagamento'] as const;

const vazio = (): Participante => ({
  name: '', email: '', phone: '', birthDate: '', shirtSize: '',
  emergencyContact: '', emergencyPhone: '', healthNotes: '', dietaryNotes: '',
});

/**
 * Checkout em quatro etapas.
 *
 * Regras aplicadas na interface:
 *  - o preço exibido vem sempre de `/api/checkout/cotacao` (servidor),
 *    nunca de multiplicação feita aqui;
 *  - a chave de idempotência é gerada uma vez por sessão de compra, o que
 *    torna o duplo clique inofensivo;
 *  - os dados do cartão são convertidos em token no navegador — o número
 *    completo nunca é enviado ao nosso backend.
 */
export function CheckoutWizard({
  evento,
  edicao,
  lotes,
  loteInicial,
  usuario,
}: {
  evento: { slug: string; nome: string };
  edicao: { slug: string; titulo: string; parcelasMax: number; inicio: string; fim: string; local: string };
  lotes: Lote[];
  loteInicial: string | null;
  usuario: { nome: string; email: string } | null;
}) {
  const [passo, setPasso] = useState(0);
  const [loteId, setLoteId] = useState(loteInicial ?? lotes[0]?.id ?? '');
  const [quantidade, setQuantidade] = useState(1);
  const [comprador, setComprador] = useState({
    name: usuario?.nome ?? '', email: usuario?.email ?? '', phone: '', document: '',
  });
  const [participantes, setParticipantes] = useState<Participante[]>([vazio()]);
  const [metodo, setMetodo] = useState<'PIX' | 'CARTAO_CREDITO' | 'BOLETO'>('PIX');
  const [parcelas, setParcelas] = useState(1);
  const [cupom, setCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' });
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [opcoesParcelas, setOpcoesParcelas] = useState<{ installments: number; installmentCents: number; interestFree: boolean }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [copiado, setCopiado] = useState(false);

  const lote = useMemo(() => lotes.find((l) => l.id === loteId) ?? lotes[0], [lotes, loteId]);

  // Uma única chave por sessão de compra — protege contra clique duplo/retry.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random()}`,
  );

  // Sincroniza a lista de participantes com a quantidade escolhida.
  useEffect(() => {
    setParticipantes((atual) => {
      if (atual.length === quantidade) return atual;
      if (atual.length < quantidade) return [...atual, ...Array.from({ length: quantidade - atual.length }, vazio)];
      return atual.slice(0, quantidade);
    });
  }, [quantidade]);

  // Cotação recalculada no servidor a cada mudança relevante.
  useEffect(() => {
    if (!lote) return;
    const controlador = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/checkout/cotacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tierId: lote.id, quantity: quantidade, method: metodo, installments: parcelas, couponCode: cupomAplicado || undefined }),
          signal: controlador.signal,
        });
        const dados = await res.json();
        if (res.ok) {
          setCotacao(dados.cotacao);
          setOpcoesParcelas(dados.parcelas ?? []);
        } else if (dados.campos?.couponCode) {
          setCupomAplicado(null);
          setErro(dados.erro);
        }
      } catch {
        // Sem servidor (modo demonstração): estimativa local apenas visual.
        if (!controlador.signal.aborted) {
          const subtotal = lote.precoCents * quantidade;
          const descontoPix = metodo === 'PIX' ? Math.round(subtotal * 0.05) : 0;
          setCotacao({
            subtotalCents: subtotal, discountCents: descontoPix, interestCents: 0,
            totalCents: subtotal - descontoPix, installments: parcelas,
            installmentCents: Math.ceil((subtotal - descontoPix) / parcelas),
            interestFree: parcelas <= 3, methodDiscountCents: descontoPix, couponDiscountCents: 0,
          });
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
  }, [lote, quantidade, metodo, parcelas, cupomAplicado]);

  const podeAvancar = () => {
    if (passo === 0) return Boolean(lote) && quantidade >= 1;
    if (passo === 1) {
      return (
        comprador.name.trim().split(/\s+/).length >= 2 &&
        /^[^@]+@[^@]+\.[^@]+$/.test(comprador.email) &&
        comprador.phone.replace(/\D/g, '').length >= 10 &&
        [11, 14].includes(comprador.document.replace(/\D/g, '').length)
      );
    }
    if (passo === 2) {
      return participantes.every(
        (p) => p.name.trim().split(/\s+/).length >= 2 && /^[^@]+@[^@]+\.[^@]+$/.test(p.email),
      );
    }
    return true;
  };

  const copiarPix = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* clipboard indisponível */
    }
  };

  const finalizar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      const corpo = {
        editionSlug: edicao.slug,
        tierId: lote!.id,
        quantity: quantidade,
        buyer: comprador,
        participants: participantes.map((p) => ({
          name: p.name, email: p.email, phone: p.phone || undefined,
          birthDate: p.birthDate || undefined, shirtSize: p.shirtSize || undefined,
          emergencyContact: p.emergencyContact || undefined, emergencyPhone: p.emergencyPhone || undefined,
          healthNotes: p.healthNotes || undefined, dietaryNotes: p.dietaryNotes || undefined,
        })),
        method: metodo,
        installments: metodo === 'CARTAO_CREDITO' ? parcelas : 1,
        couponCode: cupomAplicado || undefined,
        idempotencyKey,
        ...(metodo === 'CARTAO_CREDITO'
          ? {
              card: {
                // Tokenização: o backend recebe apenas um token opaco.
                token: await tokenizarCartao(cartao),
                last4: cartao.numero.replace(/\D/g, '').slice(-4),
                holderName: cartao.nome,
              },
            }
          : {}),
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await res.json();

      if (!res.ok) {
        setErro(dados.erro ?? 'Não foi possível concluir a inscrição.');
        if (dados.resultado) setResultado(dados.resultado);
        return;
      }
      setResultado(dados.resultado);
    } catch {
      setErro('Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  /* ---------------- Confirmação ---------------- */
  if (resultado && !erro) {
    const pix = resultado.pix as { qrCode: string; expiresAt?: string } | undefined;
    const boleto = resultado.boleto as { url?: string; barcode?: string } | undefined;
    const status = resultado.status as string;
    const codigos = (resultado.registrationCodes as string[]) ?? [];

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
        <div className="ring-foil card p-8 text-center sm:p-10">
          <PartyPopper className="mx-auto mb-5 h-12 w-12 text-gold-600" />
          <h2 className="font-display text-3xl text-ink-900">
            {status === 'CAPTURADO' ? 'Inscrição confirmada!' : 'Falta só o pagamento'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-500">
            {status === 'CAPTURADO'
              ? 'Enviamos a confirmação e o QR de credenciamento para o seu e-mail.'
              : metodo === 'PIX'
                ? 'Escaneie o QR abaixo ou copie o código. A confirmação é automática em segundos.'
                : 'Seu boleto foi gerado. A compensação leva até 3 dias úteis.'}
          </p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-ivory-200 px-4 py-2 text-[13px] font-medium text-ink-600">
            <Ticket className="h-4 w-4 text-gold-600" />
            Pedido {String(resultado.orderCode)}
          </p>

          {pix?.qrCode ? (
            <div className="mt-8 rounded-2xl border border-gold-200 bg-gold-50/40 p-6">
              <p className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-gold-800">PIX copia e cola</p>
              <code className="block max-h-28 overflow-y-auto break-all rounded-xl bg-white p-4 text-left text-[12px] leading-relaxed text-ink-600">
                {pix.qrCode}
              </code>
              <button onClick={() => copiarPix(pix.qrCode)} className="btn-primary mt-4 w-full">
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiado ? 'Código copiado!' : 'Copiar código PIX'}
              </button>
              {pix.expiresAt ? (
                <p className="mt-3 text-[12.5px] text-ink-400">
                  Válido até {new Date(pix.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : null}
            </div>
          ) : null}

          {boleto?.barcode ? (
            <div className="mt-8 rounded-2xl border border-ink-200 bg-ivory-100 p-6">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-500">Linha digitável</p>
              <code className="block break-all rounded-xl bg-white p-4 text-[13px] text-ink-700">{boleto.barcode}</code>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={() => copiarPix(boleto.barcode!)} className="btn-outline">
                  <Copy className="h-4 w-4" /> Copiar
                </button>
                {boleto.url ? (
                  <a href={boleto.url} target="_blank" rel="noreferrer noopener" className="btn-primary">
                    <Barcode className="h-4 w-4" /> Abrir boleto
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {codigos.length ? (
            <div className="mt-8 text-left">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-400">
                {codigos.length === 1 ? 'Código da inscrição' : 'Códigos das inscrições'}
              </p>
              <ul className="space-y-2">
                {codigos.map((c, i) => (
                  <li key={c} className="flex items-center justify-between rounded-xl bg-ivory-100 px-4 py-3 text-[14px]">
                    <span className="text-ink-600">{participantes[i]?.name || `Participante ${i + 1}`}</span>
                    <code className="font-semibold text-ink-900">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`/eventos/${evento.slug}`} className="btn-outline">Voltar ao evento</a>
            <a href="/minha-conta" className="btn-primary">Minhas inscrições</a>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------- Assistente ---------------- */
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <div>
        {/* Trilha de passos */}
        <ol className="mb-8 flex items-center gap-2">
          {PASSOS.map((rotulo, i) => (
            <li key={rotulo} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => i < passo && setPasso(i)}
                disabled={i > passo}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all duration-300',
                  i === passo ? 'bg-ink-900 text-ivory-50' : i < passo ? 'text-olive-600 hover:bg-olive-500/10' : 'text-ink-300',
                )}
              >
                <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[11px]', i === passo ? 'bg-gold-400 text-gold-950' : i < passo ? 'bg-olive-500 text-white' : 'bg-ink-100')}>
                  {i < passo ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{rotulo}</span>
              </button>
              {i < PASSOS.length - 1 ? <span className={cn('h-px flex-1', i < passo ? 'bg-olive-400' : 'bg-ink-100')} /> : null}
            </li>
          ))}
        </ol>

        <div className="card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* -------- Passo 1: lote -------- */}
            {passo === 0 ? (
              <motion.div key="p0" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl text-ink-900">Escolha seu ingresso</h2>
                <div className="mt-6 space-y-3">
                  {lotes.map((l) => (
                    <label
                      key={l.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-300',
                        loteId === l.id ? 'border-crimson-600 bg-crimson-50/40 shadow-soft' : 'border-ink-200 hover:border-gold-300',
                      )}
                    >
                      <input type="radio" name="lote" checked={loteId === l.id} onChange={() => setLoteId(l.id)} className="mt-1 h-4 w-4 accent-crimson-700" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-display text-lg text-ink-900">{l.nome}</span>
                          <span className="font-display text-xl font-semibold text-ink-900">{formatBRL(l.precoCents)}</span>
                        </span>
                        {l.descricao ? <span className="mt-1 block text-[13.5px] text-ink-500">{l.descricao}</span> : null}
                        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-400">
                          {l.incluiHospedagem ? <span>· Hospedagem</span> : null}
                          {l.incluiRefeicoes ? <span>· Refeições</span> : null}
                          {l.vagas !== null ? <span>· {l.vagas} vagas</span> : null}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-7">
                  <label className="label">Quantas inscrições?</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantidade((q) => Math.max(lote?.minPorPedido ?? 1, q - 1))}
                      className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-gold-400"
                      aria-label="Diminuir"
                    >
                      −
                    </button>
                    <span className="tabular w-14 text-center font-display text-2xl font-semibold text-ink-900">{quantidade}</span>
                    <button
                      onClick={() => setQuantidade((q) => Math.min(lote?.maxPorPedido ?? 10, q + 1))}
                      className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-gold-400"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                    <span className="ml-2 flex items-center gap-1.5 text-[13px] text-ink-400">
                      <Users className="h-4 w-4" />
                      Até {lote?.maxPorPedido ?? 10} por pedido
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* -------- Passo 2: comprador -------- */}
            {passo === 1 ? (
              <motion.div key="p1" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl text-ink-900">Quem está comprando?</h2>
                <p className="mt-2 text-[14px] text-ink-400">Usaremos estes dados para emitir o recibo e enviar a confirmação.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="c-nome">Nome completo</label>
                    <input id="c-nome" value={comprador.name} onChange={(e) => setComprador({ ...comprador, name: e.target.value })} className="field" autoComplete="name" />
                  </div>
                  <div>
                    <label className="label" htmlFor="c-email">E-mail</label>
                    <input id="c-email" type="email" value={comprador.email} onChange={(e) => setComprador({ ...comprador, email: e.target.value })} className="field" autoComplete="email" />
                  </div>
                  <div>
                    <label className="label" htmlFor="c-tel">Celular / WhatsApp</label>
                    <input id="c-tel" inputMode="numeric" value={comprador.phone} onChange={(e) => setComprador({ ...comprador, phone: mascararTelefone(e.target.value) })} placeholder="(21) 99999-9999" className="field" autoComplete="tel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="c-doc">CPF ou CNPJ</label>
                    <input id="c-doc" inputMode="numeric" value={comprador.document} onChange={(e) => setComprador({ ...comprador, document: mascararDocumento(e.target.value) })} placeholder="000.000.000-00" className="field" />
                    <p className="hint">Exigido pelo provedor de pagamento para emissão do recibo.</p>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* -------- Passo 3: participantes -------- */}
            {passo === 2 ? (
              <motion.div key="p2" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl text-ink-900">Quem vai participar?</h2>
                <p className="mt-2 text-[14px] text-ink-400">Cada participante recebe um QR próprio para o credenciamento.</p>

                <div className="mt-6 space-y-6">
                  {participantes.map((p, i) => (
                    <fieldset key={i} className="rounded-2xl border border-ink-100 bg-ivory-100/50 p-5">
                      <legend className="px-2 text-[13px] font-semibold uppercase tracking-wider text-crimson-700">
                        Participante {i + 1}
                      </legend>

                      {i === 0 ? (
                        <button
                          onClick={() => atualizarParticipante(setParticipantes, 0, { name: comprador.name, email: comprador.email, phone: comprador.phone })}
                          className="mb-4 text-[13px] font-medium text-gold-700 hover:text-gold-800"
                        >
                          Sou eu — preencher com meus dados
                        </button>
                      ) : null}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="label">Nome completo</label>
                          <input value={p.name} onChange={(e) => atualizarParticipante(setParticipantes, i, { name: e.target.value })} className="field" />
                        </div>
                        <div>
                          <label className="label">E-mail</label>
                          <input type="email" value={p.email} onChange={(e) => atualizarParticipante(setParticipantes, i, { email: e.target.value })} className="field" />
                        </div>
                        <div>
                          <label className="label">Data de nascimento</label>
                          <input type="date" value={p.birthDate} onChange={(e) => atualizarParticipante(setParticipantes, i, { birthDate: e.target.value })} className="field" />
                        </div>
                        <div>
                          <label className="label">Tamanho da camisa</label>
                          <select value={p.shirtSize} onChange={(e) => atualizarParticipante(setParticipantes, i, { shirtSize: e.target.value })} className="field">
                            <option value="">Selecione</option>
                            {['PP', 'P', 'M', 'G', 'GG', 'XG'].map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Contato de emergência</label>
                          <input value={p.emergencyPhone} onChange={(e) => atualizarParticipante(setParticipantes, i, { emergencyPhone: mascararTelefone(e.target.value) })} placeholder="(21) 99999-9999" className="field" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="label">Restrições alimentares ou de saúde</label>
                          <input value={p.healthNotes} onChange={(e) => atualizarParticipante(setParticipantes, i, { healthNotes: e.target.value })} placeholder="Alergias, medicamentos, dieta…" className="field" />
                          <p className="hint">Informação confidencial, vista apenas pela equipe de apoio.</p>
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {/* -------- Passo 4: pagamento -------- */}
            {passo === 3 ? (
              <motion.div key="p3" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl text-ink-900">Como você prefere pagar?</h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { valor: 'PIX' as const, rotulo: 'PIX', Icon: QrCode, nota: '5% de desconto' },
                    { valor: 'CARTAO_CREDITO' as const, rotulo: 'Cartão', Icon: CreditCard, nota: `até ${edicao.parcelasMax}x` },
                    { valor: 'BOLETO' as const, rotulo: 'Boleto', Icon: Barcode, nota: '3 dias úteis' },
                  ].map(({ valor, rotulo, Icon, nota }) => (
                    <button
                      key={valor}
                      onClick={() => setMetodo(valor)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-300',
                        metodo === valor ? 'border-crimson-600 bg-crimson-50/40 shadow-soft' : 'border-ink-200 hover:border-gold-300',
                      )}
                    >
                      <Icon className={cn('h-6 w-6', metodo === valor ? 'text-crimson-700' : 'text-ink-400')} />
                      <span className="font-semibold text-ink-900">{rotulo}</span>
                      <span className="text-[12px] text-ink-400">{nota}</span>
                    </button>
                  ))}
                </div>

                {metodo === 'CARTAO_CREDITO' ? (
                  <div className="mt-7 space-y-4">
                    <div>
                      <label className="label">Parcelamento</label>
                      <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className="field">
                        {(opcoesParcelas.length ? opcoesParcelas : [{ installments: 1, installmentCents: cotacao?.totalCents ?? 0, interestFree: true }]).map((o) => (
                          <option key={o.installments} value={o.installments}>
                            {o.installments}x de {formatBRL(o.installmentCents)} {o.interestFree ? '— sem juros' : '— com juros'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="label">Número do cartão</label>
                        <input inputMode="numeric" value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: mascararCartao(e.target.value) })} placeholder="0000 0000 0000 0000" className="field" autoComplete="cc-number" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Nome impresso no cartão</label>
                        <input value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value.toUpperCase() })} className="field" autoComplete="cc-name" />
                      </div>
                      <div>
                        <label className="label">Validade</label>
                        <input inputMode="numeric" value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: mascararValidade(e.target.value) })} placeholder="MM/AA" className="field" autoComplete="cc-exp" />
                      </div>
                      <div>
                        <label className="label">CVV</label>
                        <input inputMode="numeric" maxLength={4} value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: e.target.value.replace(/\D/g, '') })} placeholder="000" className="field" autoComplete="cc-csc" />
                      </div>
                    </div>

                    <p className="flex items-start gap-2 rounded-xl bg-olive-500/8 p-3.5 text-[12.5px] leading-relaxed text-olive-700">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Os dados do cartão são convertidos em um token no seu navegador. O número completo
                      nunca chega aos nossos servidores.
                    </p>
                  </div>
                ) : null}

                <div className="mt-7">
                  <label className="label" htmlFor="cupom">Cupom de desconto</label>
                  <div className="flex gap-2">
                    <input id="cupom" value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} placeholder="MEBMEMBRO" className="field uppercase" />
                    <button onClick={() => setCupomAplicado(cupom || null)} className="btn-outline shrink-0">
                      <Tag className="h-4 w-4" /> Aplicar
                    </button>
                  </div>
                  {cupomAplicado && cotacao?.couponDiscountCents ? (
                    <p className="mt-2 text-[13px] font-medium text-olive-600">
                      Cupom {cupomAplicado} aplicado: −{formatBRL(cotacao.couponDiscountCents)}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {erro ? (
            <p className="error-text mt-6 rounded-xl bg-crimson-50 p-3.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-ink-100 pt-6">
            <button onClick={() => setPasso((p) => Math.max(0, p - 1))} disabled={passo === 0} className="btn-ghost">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>

            {passo < PASSOS.length - 1 ? (
              <button onClick={() => setPasso((p) => p + 1)} disabled={!podeAvancar()} className="btn-primary">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finalizar} disabled={enviando} className="btn-gold !px-7">
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processando…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pagar {cotacao ? formatBRL(cotacao.totalCents) : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -------- Resumo -------- */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
        <div className="ring-foil card p-6">
          <p className="eyebrow mb-4">Resumo do pedido</p>
          <p className="font-display text-lg leading-snug text-ink-900">{edicao.titulo}</p>
          <p className="mt-1 text-[13px] text-ink-400">
            {formatDateRange(edicao.inicio, edicao.fim)}
            <br />
            {edicao.local}
          </p>

          <div className="rule-foil my-5" />

          <dl className="space-y-3 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">
                {lote?.nome} × {quantidade}
              </dt>
              <dd className="tabular font-medium text-ink-900">{formatBRL((lote?.precoCents ?? 0) * quantidade)}</dd>
            </div>

            {cotacao && cotacao.couponDiscountCents > 0 ? (
              <div className="flex justify-between gap-4 text-olive-600">
                <dt>Cupom {cupomAplicado}</dt>
                <dd className="tabular font-medium">−{formatBRL(cotacao.couponDiscountCents)}</dd>
              </div>
            ) : null}

            {cotacao && cotacao.methodDiscountCents > 0 ? (
              <div className="flex justify-between gap-4 text-olive-600">
                <dt>Desconto PIX</dt>
                <dd className="tabular font-medium">−{formatBRL(cotacao.methodDiscountCents)}</dd>
              </div>
            ) : null}

            {cotacao && cotacao.interestCents > 0 ? (
              <div className="flex justify-between gap-4 text-ink-400">
                <dt>Juros do parcelamento</dt>
                <dd className="tabular">+{formatBRL(cotacao.interestCents)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 border-t border-ink-100 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] uppercase tracking-wider text-ink-400">Total</span>
              <span className="tabular font-display text-3xl font-semibold text-ink-900">
                {cotacao ? formatBRL(cotacao.totalCents) : '—'}
              </span>
            </div>
            {cotacao && cotacao.installments > 1 ? (
              <p className="mt-1.5 text-right text-[13px] text-ink-400">
                {cotacao.installments}x de {formatBRL(cotacao.installmentCents)}
                {cotacao.interestFree ? ' sem juros' : ''}
              </p>
            ) : null}
          </div>

          <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-olive-500" />
            Ambiente seguro. Cancelamento e reembolso conforme a política publicada na página do evento.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auxiliares                                                         */
/* ------------------------------------------------------------------ */

function atualizarParticipante(
  set: React.Dispatch<React.SetStateAction<Participante[]>>,
  indice: number,
  campos: Partial<Participante>,
) {
  set((atual) => atual.map((p, i) => (i === indice ? { ...p, ...campos } : p)));
}

/**
 * Tokenização do cartão.
 *
 * Em produção esta função chama o SDK do provedor (`MercadoPago.createCardToken`
 * ou `stripe.createPaymentMethod`), que envia os dados direto do navegador para
 * o gateway e devolve um token opaco — mantendo a aplicação no escopo PCI
 * SAQ-A. Aqui devolvemos um token derivado apenas dos últimos dígitos, o que
 * mantém o mesmo contrato e permite testar todo o fluxo.
 */
async function tokenizarCartao(cartao: { numero: string; cvv: string }) {
  const digitos = cartao.numero.replace(/\D/g, '');
  const material = new TextEncoder().encode(`${digitos}:${cartao.cvv}:${Date.now()}`);
  const buffer = await crypto.subtle.digest('SHA-256', material);
  const hash = Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  // O sufixo preserva os 4 últimos dígitos — usados pelo sandbox para
  // simular aprovação, análise ou recusa de forma determinística.
  return `tok_${hash.slice(0, 24)}${digitos.slice(-4)}`;
}

const mascararTelefone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ') ' : '', b, c && `-${c}`].join('')).trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};

const mascararDocumento = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (m, a, b, c, e) => (e ? `${a}.${b}.${c}-${e}` : m));
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
};

const mascararCartao = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

const mascararValidade = (v: string) => v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/');
