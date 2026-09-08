'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ASSUNTOS = [
  'Quero visitar a igreja',
  'Aconselhamento pastoral',
  'Dúvida sobre um evento',
  'Ministérios e voluntariado',
  'Batismo e membresia',
  'Parceria ou imprensa',
  'Outro assunto',
];

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: ASSUNTOS[0]!, message: '' });
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: form.phone.replace(/\D/g, '') }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro ?? 'Não foi possível enviar sua mensagem.');
        setCampos(dados.campos ?? {});
        return;
      }
      setEnviado(true);
    } catch {
      setErro('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="ring-foil card p-10 text-center">
        <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-olive-500" />
        <h2 className="font-display text-2xl text-ink-900">Mensagem enviada</h2>
        <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-500">
          Recebemos o seu contato. Nossa equipe responde em até um dia útil — e, se for urgente,
          fale com a gente pelo WhatsApp.
        </p>
        <button onClick={() => { setEnviado(false); setForm({ ...form, message: '' }); }} className="btn-ghost mt-6 text-[13.5px]">
          Enviar outra mensagem
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={enviar} className="card p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="nome">Seu nome</label>
          <input id="nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={cn('field', campos.name && 'field-error')} autoComplete="name" required />
          {campos.name ? <p className="error-text">{campos.name}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={cn('field', campos.email && 'field-error')} autoComplete="email" required />
          {campos.email ? <p className="error-text">{campos.email}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="tel">Telefone (opcional)</label>
          <input id="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(21) 99999-9999" className="field" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="assunto">Assunto</label>
          <select id="assunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="field">
            {ASSUNTOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="msg">Mensagem</label>
          <textarea id="msg" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={cn('field resize-none', campos.message && 'field-error')} required />
          {campos.message ? <p className="error-text">{campos.message}</p> : null}
        </div>
      </div>

      {erro ? (
        <p className="error-text mt-5 rounded-xl bg-crimson-50 p-3.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <button type="submit" disabled={enviando} className="btn-primary mt-6 w-full sm:w-auto">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {enviando ? 'Enviando…' : 'Enviar mensagem'}
      </button>

      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-300">
        Seus dados são usados apenas para responder este contato, conforme a LGPD.
      </p>
    </form>
  );
}
