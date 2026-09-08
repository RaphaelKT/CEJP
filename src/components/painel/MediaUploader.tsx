'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload, X, ImageIcon, MapPin, CalendarDays, Camera, Check, AlertTriangle,
  Loader2, ShieldCheck, Info, RotateCcw, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDate, relativeTime } from '@/lib/utils/format';

type Edicao = { id: string; rotulo: string; ano: number; inicio: string; fim: string; venueId: string | null };
type Local = { id: string; nome: string; cidade: string; cep: string };
type Historico = {
  code: string; status: string; total: number; aprovadas: number; reprovadas: number;
  score: number | null; mensagem: string | null; criadoEm: string;
};

type Resposta = {
  ok: boolean;
  veredito: string;
  mensagem: string;
  resumo: { total: number; aprovadas: number; emRevisao: number; reprovadas: number; score: number };
  camposParaRevisar: string[];
  detalhes: { arquivo?: string; score: number; veredito: string; sinais: { chave: string; rotulo: string; status: string; detalhe: string }[] }[];
};

const CONTEXTOS = [
  { valor: 'EVENTO', rotulo: 'Evento (retiro, congresso, JUMEB…)' },
  { valor: 'CULTO', rotulo: 'Culto regular' },
  { valor: 'MISSAO', rotulo: 'Viagem missionária' },
  { valor: 'ACAO_SOCIAL', rotulo: 'Ação social' },
];

const TAGS_SUGERIDAS = ['louvor', 'pregação', 'batismo', 'santa ceia', 'juventude', 'infantil', 'comunhão', 'oração', 'bastidores', 'equipe'];

const ROTULO_CAMPO: Record<string, string> = {
  venueId: 'Local da captação',
  capturedOn: 'Data das fotos',
  editionId: 'Evento / edição',
  eventYear: 'Ano do evento',
};

/**
 * Formulário guiado da equipe de mídia.
 *
 * A ordem dos campos é intencional: primeiro o *contexto* (o que era),
 * depois *quando* e *onde* — porque são exatamente esses três dados que a
 * validação automática usa para conferir cada foto.
 */
export function MediaUploader({
  edicoes,
  locais,
  limiteMb,
  historico,
}: {
  edicoes: Edicao[];
  locais: Local[];
  limiteMb: number;
  historico: Historico[];
}) {
  const [contexto, setContexto] = useState('EVENTO');
  const [edicaoId, setEdicaoId] = useState('');
  const [rotuloOcorrencia, setRotuloOcorrencia] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [data, setData] = useState('');
  const [localId, setLocalId] = useState(locais[0]?.id ?? '');
  const [fotografo, setFotografo] = useState('');
  const [legenda, setLegenda] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [temMenores, setTemMenores] = useState(false);
  const [consentimento, setConsentimento] = useState(false);

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [previas, setPrevias] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const edicao = useMemo(() => edicoes.find((e) => e.id === edicaoId), [edicoes, edicaoId]);

  const adicionar = useCallback(
    (lista: FileList | File[]) => {
      const novos = Array.from(lista).filter((f) => f.type.startsWith('image/'));
      const excedentes = novos.filter((f) => f.size > limiteMb * 1024 * 1024);
      if (excedentes.length) {
        setErro(`${excedentes.length} arquivo(s) acima de ${limiteMb} MB foram ignorados.`);
      }
      const aceitos = novos.filter((f) => f.size <= limiteMb * 1024 * 1024);
      setArquivos((atual) => [...atual, ...aceitos].slice(0, 60));
      setPrevias((atual) => [...atual, ...aceitos.map((f) => URL.createObjectURL(f))].slice(0, 60));
    },
    [limiteMb],
  );

  const remover = (indice: number) => {
    URL.revokeObjectURL(previas[indice]!);
    setArquivos((a) => a.filter((_, i) => i !== indice));
    setPrevias((p) => p.filter((_, i) => i !== indice));
  };

  const valido =
    arquivos.length > 0 &&
    data !== '' &&
    localId !== '' &&
    consentimento &&
    (contexto !== 'EVENTO' || edicaoId !== '');

  const enviar = async () => {
    setErro(null);
    setResposta(null);
    setEnviando(true);
    setProgresso(0);

    try {
      const form = new FormData();
      form.append(
        'relatorio',
        JSON.stringify({
          contextKind: contexto,
          editionId: edicaoId || undefined,
          occurrenceLabel: rotuloOcorrencia || undefined,
          eventYear: ano,
          capturedOn: data,
          venueId: localId,
          photographer: fotografo || undefined,
          caption: legenda || undefined,
          tags,
          hasMinors: temMenores,
          consentConfirmed: consentimento,
        }),
      );
      for (const arquivo of arquivos) form.append('fotos', arquivo);

      // XHR em vez de fetch: precisamos do evento de progresso do upload.
      const dados = await new Promise<Resposta>((resolver, rejeitar) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/midia/enviar');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolver(json);
            else if (json.veredito) resolver(json);
            else rejeitar(new Error(json.erro ?? 'Falha no envio.'));
          } catch {
            rejeitar(new Error('Resposta inválida do servidor.'));
          }
        };
        xhr.onerror = () => rejeitar(new Error('Falha de rede durante o envio.'));
        xhr.send(form);
      });

      setResposta(dados);
      if (dados.veredito !== 'REPROVADO') {
        setArquivos([]);
        previas.forEach((p) => URL.revokeObjectURL(p));
        setPrevias([]);
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setProgresso(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------- Relatório ---------- */}
      <section className="card p-6 sm:p-7">
        <h2 className="flex items-center gap-2.5 font-display text-xl text-ink-900">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-crimson-700 text-[13px] font-bold text-white">1</span>
          Relatório da captação
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contexto">O que foi fotografado?</label>
            <select id="contexto" value={contexto} onChange={(e) => setContexto(e.target.value)} className="field">
              {CONTEXTOS.map((c) => (
                <option key={c.valor} value={c.valor}>{c.rotulo}</option>
              ))}
            </select>
          </div>

          {contexto === 'EVENTO' ? (
            <div>
              <label className="label" htmlFor="edicao">Evento e edição</label>
              <select
                id="edicao"
                value={edicaoId}
                onChange={(e) => {
                  setEdicaoId(e.target.value);
                  const ed = edicoes.find((x) => x.id === e.target.value);
                  if (ed) {
                    setAno(ed.ano);
                    setData(ed.inicio.slice(0, 10));
                    if (ed.venueId) setLocalId(ed.venueId);
                  }
                }}
                className="field"
              >
                <option value="">Selecione…</option>
                {edicoes.map((e) => (
                  <option key={e.id} value={e.id}>{e.rotulo}</option>
                ))}
              </select>
              {edicoes.length === 0 ? (
                <p className="hint">Nenhuma edição cadastrada ainda — cadastre o evento primeiro.</p>
              ) : null}
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="ocorrencia">Identificação</label>
              <input
                id="ocorrencia"
                value={rotuloOcorrencia}
                onChange={(e) => setRotuloOcorrencia(e.target.value)}
                placeholder="Ex.: Culto de celebração — domingo à noite"
                className="field"
              />
            </div>
          )}

          <div>
            <label className="label" htmlFor="ano">Ano</label>
            <select id="ano" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="field">
              {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 1 - i).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="data">
              <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Data em que as fotos foram tiradas
            </label>
            <input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="field" />
            {edicao ? (
              <p className="hint">
                O evento ocorreu de {formatDate(edicao.inicio, 'curta')} a {formatDate(edicao.fim, 'curta')}.
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="local">
              <MapPin className="mr-1 inline h-3.5 w-3.5" /> Local da captação
            </label>
            <select id="local" value={localId} onChange={(e) => setLocalId(e.target.value)} className="field">
              {locais.map((l) => (
                <option key={l.id} value={l.id}>{l.nome} — {l.cidade} (CEP {l.cep})</option>
              ))}
            </select>
            <p className="hint">
              A coordenada gravada em cada foto será comparada com este endereço. Se divergir, a foto
              não é publicada.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="fotografo">
              <Camera className="mr-1 inline h-3.5 w-3.5" /> Fotógrafo(a)
            </label>
            <input id="fotografo" value={fotografo} onChange={(e) => setFotografo(e.target.value)} placeholder="Nome de quem fotografou" className="field" />
          </div>

          <div>
            <label className="label" htmlFor="legenda">Legenda (opcional)</label>
            <input id="legenda" value={legenda} onChange={(e) => setLegenda(e.target.value)} maxLength={240} placeholder="Ex.: Noite de louvor no encerramento" className="field" />
          </div>

          <div className="sm:col-span-2">
            <span className="label">Marcadores</span>
            <div className="flex flex-wrap gap-1.5">
              {TAGS_SUGERIDAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags((atual) => (atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t]))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12.5px] transition-colors',
                    tags.includes(t) ? 'border-crimson-600 bg-crimson-50 text-crimson-700' : 'border-ink-200 text-ink-500 hover:border-gold-300',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl bg-ivory-100 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-ink-600">
            <input type="checkbox" checked={temMenores} onChange={(e) => setTemMenores(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700" />
            <span>
              <strong className="block font-semibold text-ink-900">Há crianças ou adolescentes nas fotos</strong>
              Estas imagens passam por conferência adicional antes de ir ao ar.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-ink-600">
            <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700" />
            <span>
              <strong className="block font-semibold text-ink-900">Confirmo autorização de uso de imagem</strong>
              As pessoas retratadas assinaram o termo ou o evento tinha aviso visível de captação.
            </span>
          </label>
        </div>
      </section>

      {/* ---------- Fotos ---------- */}
      <section className="card p-6 sm:p-7">
        <h2 className="flex items-center gap-2.5 font-display text-xl text-ink-900">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-crimson-700 text-[13px] font-bold text-white">2</span>
          As fotos
        </h2>

        <div
          onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionar(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300',
            arrastando ? 'border-gold-500 bg-gold-50' : 'border-ink-200 hover:border-gold-400 hover:bg-gold-50/40',
          )}
        >
          <Upload className={cn('mx-auto mb-3 h-9 w-9 transition-colors', arrastando ? 'text-gold-600' : 'text-ink-300')} />
          <p className="font-display text-lg text-ink-900">Arraste as fotos aqui</p>
          <p className="mt-1.5 text-[13.5px] text-ink-400">
            ou clique para escolher · JPG, PNG, WebP ou HEIC · até {limiteMb} MB cada · máximo 60 fotos
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && adicionar(e.target.files)}
            className="hidden"
          />
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl bg-gold-50 p-3.5 text-[12.5px] leading-relaxed text-gold-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Envie os arquivos <strong>originais</strong> da câmera ou do celular. Fotos que passaram por
          WhatsApp perdem a localização e a data no arquivo, e vão para conferência manual.
        </p>

        {arquivos.length ? (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[13.5px] font-medium text-ink-600">
                {arquivos.length} {arquivos.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </p>
              <button
                onClick={() => { previas.forEach(URL.revokeObjectURL); setArquivos([]); setPrevias([]); }}
                className="text-[13px] font-medium text-crimson-700 hover:text-crimson-800"
              >
                Limpar tudo
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              <AnimatePresence>
                {previas.map((src, i) => (
                  <motion.div
                    key={src}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-ivory-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); remover(i); }}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remover foto ${i + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </section>

      {/* ---------- Envio ---------- */}
      <section className="card p-6 sm:p-7">
        {erro ? (
          <p className="error-text mb-4 rounded-xl bg-crimson-50 p-3.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {erro}
          </p>
        ) : null}

        {enviando ? (
          <div className="mb-5">
            <div className="flex items-center justify-between text-[13.5px] text-ink-600">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                {progresso < 100 ? 'Enviando fotos…' : 'Conferindo localização e data de cada imagem…'}
              </span>
              <span className="tabular font-semibold">{progresso}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <motion.div className="h-full rounded-full bg-gold-sheen" animate={{ width: `${progresso}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        ) : null}

        <button onClick={enviar} disabled={!valido || enviando} className="btn-primary w-full !py-4">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {enviando ? 'Processando…' : `Enviar ${arquivos.length || ''} ${arquivos.length === 1 ? 'foto' : 'fotos'} para conferência`}
        </button>

        {!valido && !enviando ? (
          <p className="mt-3 text-center text-[12.5px] text-ink-400">
            {arquivos.length === 0
              ? 'Selecione ao menos uma foto.'
              : !consentimento
                ? 'Confirme a autorização de uso de imagem.'
                : !data
                  ? 'Informe a data em que as fotos foram tiradas.'
                  : contexto === 'EVENTO' && !edicaoId
                    ? 'Selecione o evento e a edição.'
                    : 'Complete os campos do relatório.'}
          </p>
        ) : null}
      </section>

      {/* ---------- Resultado ---------- */}
      <AnimatePresence>
        {resposta ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'card overflow-hidden p-6 sm:p-7',
              resposta.veredito === 'APROVADO_AUTOMATICO' && 'border-olive-400/50',
              resposta.veredito === 'REPROVADO' && 'border-crimson-400/60',
            )}
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                  resposta.veredito === 'APROVADO_AUTOMATICO' ? 'bg-olive-500/15 text-olive-600'
                    : resposta.veredito === 'REPROVADO' ? 'bg-crimson-50 text-crimson-700'
                      : 'bg-gold-100 text-gold-700',
                )}
              >
                {resposta.veredito === 'APROVADO_AUTOMATICO' ? <Check className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg text-ink-900">
                  {resposta.veredito === 'APROVADO_AUTOMATICO' ? 'Fotos publicadas'
                    : resposta.veredito === 'REPROVADO' ? 'Revise o relatório'
                      : 'Enviado para conferência'}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{resposta.mensagem}</p>

                {resposta.camposParaRevisar.length ? (
                  <div className="mt-4 rounded-xl border border-crimson-200 bg-crimson-50/60 p-4">
                    <p className="text-[13px] font-semibold text-crimson-800">Campos a corrigir:</p>
                    <ul className="mt-2 space-y-1.5">
                      {resposta.camposParaRevisar.map((c) => (
                        <li key={c} className="flex items-center gap-2 text-[13.5px] text-crimson-700">
                          <RotateCcw className="h-3.5 w-3.5" />
                          {ROTULO_CAMPO[c] ?? c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Total', resposta.resumo.total, 'text-ink-900'],
                    ['Publicadas', resposta.resumo.aprovadas, 'text-olive-600'],
                    ['Em revisão', resposta.resumo.emRevisao, 'text-gold-700'],
                    ['Devolvidas', resposta.resumo.reprovadas, 'text-crimson-700'],
                  ].map(([rotulo, valor, cor]) => (
                    <div key={rotulo as string} className="rounded-xl bg-ivory-100 p-3.5 text-center">
                      <dd className={cn('tabular font-display text-2xl font-semibold', cor as string)}>{valor as number}</dd>
                      <dt className="mt-0.5 text-[11.5px] uppercase tracking-wider text-ink-400">{rotulo as string}</dt>
                    </div>
                  ))}
                </dl>

                <button
                  onClick={() => setDetalhesAbertos((v) => !v)}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold-700 hover:text-gold-800"
                >
                  {detalhesAbertos ? 'Ocultar' : 'Ver'} conferência foto a foto
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detalhesAbertos && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {detalhesAbertos ? (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      {resposta.detalhes.map((d, i) => (
                        <li key={i} className="rounded-xl border border-ink-100 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-[13.5px] font-medium text-ink-800">
                              <ImageIcon className="mr-1.5 inline h-3.5 w-3.5 text-ink-300" />
                              {d.arquivo ?? `Foto ${i + 1}`}
                            </p>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider',
                                d.veredito === 'APROVADO' ? 'bg-olive-500/15 text-olive-600'
                                  : d.veredito === 'REVISAO' ? 'bg-gold-100 text-gold-800'
                                    : 'bg-crimson-50 text-crimson-700',
                              )}
                            >
                              {d.score}/100
                            </span>
                          </div>
                          <ul className="mt-3 space-y-1.5">
                            {d.sinais.map((s) => (
                              <li key={s.chave} className="flex gap-2 text-[12.5px] leading-relaxed">
                                <span
                                  className={cn(
                                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                                    s.status === 'ok' ? 'bg-olive-500'
                                      : s.status === 'alerta' ? 'bg-gold-500'
                                        : s.status === 'falha' ? 'bg-crimson-600' : 'bg-ink-300',
                                  )}
                                />
                                <span className="text-ink-500">
                                  <strong className="font-semibold text-ink-700">{s.rotulo}:</strong> {s.detalhe}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* ---------- Histórico ---------- */}
      {historico.length ? (
        <section className="card p-6 sm:p-7">
          <h2 className="font-display text-lg text-ink-900">Últimos envios</h2>
          <ul className="mt-4 divide-y divide-ink-100">
            {historico.map((h) => (
              <li key={h.code} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-ink-800">
                    {h.code} · {h.total} fotos
                  </p>
                  {h.mensagem ? <p className="mt-0.5 truncate text-[12.5px] text-ink-400">{h.mensagem}</p> : null}
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                      h.status === 'APROVADO_AUTOMATICO' || h.status === 'PUBLICADO' ? 'bg-olive-500/15 text-olive-600'
                        : h.status === 'REPROVADO' ? 'bg-crimson-50 text-crimson-700' : 'bg-gold-100 text-gold-800',
                    )}
                  >
                    {h.status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <p className="mt-1 text-[11.5px] text-ink-300">{relativeTime(h.criadoEm)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
