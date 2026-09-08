'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle2, AlertTriangle, Loader2, MapPin, ScanLine, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Resultado = {
  ok: boolean;
  status: string;
  trustScore: number;
  mensagem: string;
  sinais: Record<string, unknown>;
};

/**
 * Registro de presença pelo celular do próprio membro.
 *
 * Três sinais são coletados aqui e conferidos no servidor:
 *  1. o código rotativo do telão (válido por 60s);
 *  2. a localização do aparelho (comparada com a geocerca do templo);
 *  3. uma impressão digital estável do dispositivo, que detecta um mesmo
 *     aparelho tentando registrar presença para várias contas.
 */
export function CheckInPanel({ nome }: { nome: string }) {
  const [codigo, setCodigo] = useState('');
  const [modo, setModo] = useState<'camera' | 'codigo'>('codigo');
  const [localizacao, setLocalizacao] = useState<GeolocationPosition | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Localização é solicitada assim que a página abre.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setErroLocal('Este navegador não informa localização. Você ainda pode registrar pelo código.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocalizacao(pos),
      () => setErroLocal('Não conseguimos acessar sua localização. O código do telão continua valendo.'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  // Leitura do QR pela câmera, quando o navegador oferece BarcodeDetector.
  useEffect(() => {
    if (modo !== 'camera') {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

    let ativo = true;
    let intervalo: ReturnType<typeof setInterval>;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!ativo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(s: CanvasImageSource): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        if (!Detector) {
          setErro('Este navegador não lê QR pela câmera. Digite o código exibido no telão.');
          setModo('codigo');
          return;
        }

        const detector = new Detector({ formats: ['qr_code'] });
        intervalo = setInterval(async () => {
          if (!videoRef.current || !ativo) return;
          try {
            const codigos = await detector.detect(videoRef.current);
            if (codigos[0]?.rawValue) {
              setCodigo(codigos[0].rawValue);
              setModo('codigo');
            }
          } catch {
            /* quadro sem QR */
          }
        }, 600);
      } catch {
        setErro('Não conseguimos acessar a câmera. Digite o código exibido no telão.');
        setModo('codigo');
      }
    })();

    return () => {
      ativo = false;
      clearInterval(intervalo);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [modo]);

  const registrar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch('/api/presenca/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenCode: codigo.trim(),
          method: 'QR_ROTATIVO',
          latitude: localizacao?.coords.latitude,
          longitude: localizacao?.coords.longitude,
          accuracyM: localizacao?.coords.accuracy,
          deviceHash: await impressaoDigital(),
        }),
      });
      const dados = await res.json();
      if (!res.ok && !dados.status) {
        setErro(dados.erro ?? 'Não foi possível registrar sua presença.');
        return;
      }
      setResultado(dados);
    } catch {
      setErro('Sem conexão. Aproxime-se do wi-fi da igreja e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    const sucesso = resultado.status === 'CONFIRMADO' || resultado.status === 'DUPLICADO';
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('ring-foil card p-8 text-center', !sucesso && 'border-gold-300')}
      >
        {sucesso ? (
          <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-olive-500" />
        ) : (
          <AlertTriangle className="mx-auto mb-5 h-14 w-14 text-gold-600" />
        )}
        <h2 className="font-display text-2xl text-ink-900">
          {sucesso ? `Presença registrada, ${nome}!` : 'Precisamos confirmar'}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-500">{resultado.mensagem}</p>

        <div className="mt-6 rounded-2xl bg-ivory-100 p-4">
          <p className="text-[12px] uppercase tracking-wider text-ink-400">Confiança do registro</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={cn('h-full rounded-full', resultado.trustScore >= 70 ? 'bg-olive-500' : resultado.trustScore >= 40 ? 'bg-gold-500' : 'bg-crimson-600')}
              style={{ width: `${resultado.trustScore}%` }}
            />
          </div>
          <p className="tabular mt-1.5 text-[13px] font-semibold text-ink-700">{resultado.trustScore}/100</p>
        </div>

        <a href="/minha-conta" className="btn-primary mt-7 w-full">Ver minha conta</a>
      </motion.div>
    );
  }

  return (
    <div className="card p-6 sm:p-7">
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setModo('codigo')}
          className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors', modo === 'codigo' ? 'bg-ink-900 text-ivory-50' : 'border border-ink-200 text-ink-600')}
        >
          <KeyRound className="h-4 w-4" /> Digitar código
        </button>
        <button
          onClick={() => setModo('camera')}
          className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors', modo === 'camera' ? 'bg-ink-900 text-ivory-50' : 'border border-ink-200 text-ink-600')}
        >
          <Camera className="h-4 w-4" /> Escanear QR
        </button>
      </div>

      {modo === 'camera' ? (
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-950">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-gold-400/70" />
          <ScanLine className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse text-gold-300/70" />
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="codigo">Código exibido no telão</label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.trim())}
            placeholder="Cole ou digite o código"
            className="field font-mono text-[14px]"
            autoComplete="off"
          />
          <p className="hint">O código muda a cada minuto — se der erro, olhe o telão de novo.</p>
        </div>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-ivory-100 p-3.5 text-[12.5px] leading-relaxed">
        <MapPin className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', localizacao ? 'text-olive-500' : 'text-ink-300')} />
        <span className="text-ink-500">
          {localizacao
            ? `Localização confirmada (precisão de ${Math.round(localizacao.coords.accuracy)} m).`
            : (erroLocal ?? 'Buscando sua localização…')}
        </span>
      </div>

      {erro ? (
        <p className="error-text mt-4 rounded-xl bg-crimson-50 p-3.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <button onClick={registrar} disabled={enviando || codigo.length < 8} className="btn-primary mt-5 w-full !py-4">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {enviando ? 'Registrando…' : 'Registrar minha presença'}
      </button>
    </div>
  );
}

/**
 * Impressão digital leve e estável do dispositivo.
 * Não identifica a pessoa — serve apenas para detectar um mesmo aparelho
 * registrando presença para várias contas diferentes no mesmo culto.
 */
async function impressaoDigital() {
  const sinais = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency ?? ''),
  ].join('|');
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sinais));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
