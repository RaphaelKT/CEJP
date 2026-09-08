'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { PasswordField } from '@/components/ui/PasswordField';
import { cn } from '@/lib/utils/cn';

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', birthDate: '', password: '', confirmPassword: '',
  });
  const [aceite, setAceite] = useState(false);
  const [novidades, setNovidades] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const set = (chave: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [chave]: e.target.value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\D/g, ''),
          acceptPrivacy: aceite,
          marketingOptIn: novidades,
        }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro ?? 'Não foi possível concluir o cadastro.');
        setCampos(dados.campos ?? {});
        return;
      }
      setPronto(true);
      setTimeout(() => {
        router.push('/minha-conta');
        router.refresh();
      }, 1800);
    } catch {
      setErro('Sem conexão com o servidor. Verifique sua internet.');
    } finally {
      setEnviando(false);
    }
  };

  if (pronto) {
    return (
      <div className="text-center">
        <PartyPopper className="mx-auto mb-5 h-12 w-12 text-gold-600" />
        <h1 className="font-display text-3xl text-ink-900">Bem-vindo à família!</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15.5px] leading-relaxed text-ink-500">
          Sua conta foi criada. Estamos te levando para a sua área — enviamos também um e-mail para
          você confirmar o endereço.
        </p>
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[2.25rem] leading-tight text-ink-900">Criar minha conta</h1>
      <p className="mt-3 text-[15.5px] text-ink-500">
        Leva menos de um minuto. Você entra como visitante e a membresia é reconhecida pela sua
        presença nos cultos.
      </p>

      <form onSubmit={enviar} className="mt-8 space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="nome">Nome completo</label>
          <input id="nome" value={form.fullName} onChange={set('fullName')} className={cn('field', campos.fullName && 'field-error')} autoComplete="name" required />
          {campos.fullName ? <p className="error-text">{campos.fullName}</p> : null}
        </div>

        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} className={cn('field', campos.email && 'field-error')} autoComplete="email" required />
          {campos.email ? <p className="error-text">{campos.email}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tel">Celular</label>
            <input
              id="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: mascararTelefone(e.target.value) }))}
              placeholder="(21) 99999-9999"
              className={cn('field', campos.phone && 'field-error')}
              autoComplete="tel"
            />
            {campos.phone ? <p className="error-text">{campos.phone}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="nasc">Data de nascimento</label>
            <input id="nasc" type="date" value={form.birthDate} onChange={set('birthDate')} className="field" autoComplete="bday" />
          </div>
        </div>

        <PasswordField value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} mostrarForca erro={campos.password} />

        <div>
          <label className="label" htmlFor="conf">Confirmar senha</label>
          <input
            id="conf"
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            className={cn('field', campos.confirmPassword && 'field-error')}
            autoComplete="new-password"
            required
          />
          {campos.confirmPassword ? <p className="error-text">{campos.confirmPassword}</p> : null}
        </div>

        <div className="space-y-3 rounded-2xl bg-ivory-100 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-ink-600">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700" required />
            <span>
              Li e aceito a{' '}
              <Link href="/privacidade" className="font-medium text-gold-700 underline">Política de Privacidade</Link> e os{' '}
              <Link href="/termos" className="font-medium text-gold-700 underline">Termos de uso</Link>.
            </span>
          </label>
          {campos.acceptPrivacy ? <p className="error-text">{campos.acceptPrivacy}</p> : null}

          <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-ink-600">
            <input type="checkbox" checked={novidades} onChange={(e) => setNovidades(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-crimson-700" />
            Quero receber avisos sobre cultos, eventos e o versículo do dia.
          </label>
        </div>

        {erro ? (
          <p className="error-text rounded-xl bg-crimson-50 p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {erro}
          </p>
        ) : null}

        <button type="submit" disabled={enviando || !aceite} className="btn-primary group w-full">
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Criando conta…
            </>
          ) : (
            <>
              Criar minha conta
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[14.5px] text-ink-500">
        Já tem conta?{' '}
        <Link href="/entrar" className="font-semibold text-crimson-700 hover:text-crimson-800">
          Entrar
        </Link>
      </p>
    </div>
  );
}

const mascararTelefone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
