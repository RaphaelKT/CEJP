'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarX2, Users, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { Logo } from '@/components/ui/Logo';
import { formatDate } from '@/lib/utils/format';

type Culto = { id: string; titulo: string; inicio: string; presentes: number } | null;

/**
 * Totem de presença.
 *
 * Fica aberto numa TV ou tablet na entrada do templo. O QR é buscado do
 * servidor (que o assina) e renovado antes de expirar. Nenhum código é
 * gerado no navegador — se fosse, bastaria abrir o console para forjar um.
 */
export function Totem({ culto }: { culto: Culto }) {
  const [qr, setQr] = useState<string | null>(null);
  const [restante, setRestante] = useState(60);
  const [presentes, setPresentes] = useState(culto?.presentes ?? 0);
  const [online, setOnline] = useState(true);

  const renovar = useCallback(async () => {
    try {
      const res = await fetch(`/api/presenca/token${culto ? `?culto=${culto.id}` : ''}`, { cache: 'no-store' });
      if (!res.ok) {
        setOnline(false);
        return;
      }
      const dados = (await res.json()) as {
        code: string;
        secondsRemaining: number;
        culto: { presentes: number };
      };
      const url = `${window.location.origin}/presenca?c=${encodeURIComponent(dados.code)}`;
      setQr(
        await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 720,
          color: { dark: '#171310', light: '#FFFDF9' },
        }),
      );
      setRestante(dados.secondsRemaining);
      setPresentes(dados.culto.presentes);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [culto]);

  useEffect(() => {
    void renovar();
    const id = setInterval(() => void renovar(), 30_000);
    return () => clearInterval(id);
  }, [renovar]);

  useEffect(() => {
    const id = setInterval(() => setRestante((s) => (s <= 1 ? 60 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!culto) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <CalendarX2 className="mb-6 h-16 w-16 text-ink-300" />
        <h1 className="font-display text-3xl text-ink-900">Nenhum culto agora</h1>
        <p className="mt-3 max-w-md text-[16px] text-ink-500">
          O totem liga sozinho até 3 horas antes do próximo culto. Se a programação mudou, materialize
          os cultos da semana no painel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-8">
      <div className="mb-8 flex items-center gap-3">
        <Logo className="h-10 w-auto" />
        <div className="leading-none">
          <p className="font-display text-lg font-semibold text-ink-900">Missão Evangélica</p>
          <p className="text-2xs font-semibold uppercase tracking-[0.3em] text-gold-600">do Brasil</p>
        </div>
      </div>

      <p className="eyebrow mb-2">{formatDate(culto.inicio, 'completa')}</p>
      <h1 className="text-center font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight text-ink-900">
        {culto.titulo}
      </h1>
      <p className="mt-4 text-center text-[clamp(1rem,2vw,1.4rem)] text-ink-500">
        Aponte a câmera do celular para registrar sua presença
      </p>

      <div className="ring-foil relative mt-10 rounded-[28px] bg-white p-6 shadow-lift">
        <AnimatePresence mode="wait">
          {qr ? (
            <motion.img
              key={qr.slice(-24)}
              src={qr}
              alt="QR de presença"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="h-[min(52vh,420px)] w-[min(52vh,420px)]"
            />
          ) : (
            <div className="grid h-[min(52vh,420px)] w-[min(52vh,420px)] place-items-center">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600" />
            </div>
          )}
        </AnimatePresence>

        {/* Anel de tempo restante */}
        <svg className="pointer-events-none absolute -inset-2" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <rect
            x="1" y="1" width="98" height="98" rx="6"
            fill="none" stroke="#C8992B" strokeWidth="1"
            strokeDasharray="392"
            strokeDashoffset={392 - (restante / 60) * 392}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
            opacity="0.8"
          />
        </svg>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[15px]">
        <span className="flex items-center gap-2 text-ink-500">
          <Users className="h-[18px] w-[18px] text-gold-600" />
          <strong className="tabular font-display text-2xl font-semibold text-ink-900">{presentes}</strong>
          presentes
        </span>
        <span className="flex items-center gap-2 text-ink-400">
          {online ? <Wifi className="h-4 w-4 text-olive-500" /> : <WifiOff className="h-4 w-4 text-crimson-600" />}
          {online ? `Novo código em ${restante}s` : 'Sem conexão — reconectando'}
        </span>
      </div>

      <p className="mt-8 max-w-lg text-center text-[13.5px] leading-relaxed text-ink-400">
        Sem celular? Fale com a equipe na entrada — a recepção registra sua presença pelo tablet.
      </p>
    </div>
  );
}
