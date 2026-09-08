'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { PasswordField } from '@/components/ui/PasswordField';
import { cn } from '@/lib/utils/cn';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get('proximo') ?? '/minha-conta';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha, remember: lembrar }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro ?? 'Não foi possível entrar.');
        setCampos(dados.campos ?? {});
        return;
      }
      router.push(destino);
      router.refresh();
    } catch {
      setErro('Sem conexão com o servidor. Verifique sua internet.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-[2.25rem] leading-tight text-ink-900">Que bom te ver de novo</h1>
      <p className="mt-3 text-[15.5px] text-ink-500">
        Entre para acompanhar suas inscrições, presenças e o mural de orações.
      </p>

      <form onSubmit={enviar} className="mt-9 space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn('field', campos.email && 'field-error')}
            autoComplete="email"
            required
          />
          {campos.email ? <p className="error-text">{campos.email}</p> : null}
        </div>

        <PasswordField id="senha" label="Senha" value={senha} onChange={setSenha} autoComplete="current-password" erro={campos.password} />

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-ink-600">
            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4 accent-crimson-700" />
            Manter conectado
          </label>
          <Link href="/recuperar-senha" className="text-[13.5px] font-medium text-gold-700 hover:text-gold-800">
            Esqueci minha senha
          </Link>
        </div>

        {erro ? (
          <p className="error-text rounded-xl bg-crimson-50 p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {erro}
          </p>
        ) : null}

        <button type="submit" disabled={enviando} className="btn-primary group w-full">
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[14.5px] text-ink-500">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-crimson-700 hover:text-crimson-800">
          Criar agora
        </Link>
      </p>

      <p className="mt-10 text-center text-[12.5px] leading-relaxed text-ink-300">
        Ao entrar você concorda com nossos{' '}
        <Link href="/termos" className="underline hover:text-ink-500">Termos de uso</Link> e a{' '}
        <Link href="/privacidade" className="underline hover:text-ink-500">Política de Privacidade</Link>.
      </p>
    </div>
  );
}
