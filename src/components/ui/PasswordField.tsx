'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const REGRAS = [
  { rotulo: 'Ao menos 8 caracteres', teste: (v: string) => v.length >= 8 },
  { rotulo: 'Uma letra maiúscula', teste: (v: string) => /[A-ZÀ-Ú]/.test(v) },
  { rotulo: 'Uma letra minúscula', teste: (v: string) => /[a-zà-ú]/.test(v) },
  { rotulo: 'Um número', teste: (v: string) => /\d/.test(v) },
];

/** Campo de senha com medidor de força e checklist acessível. */
export function PasswordField({
  value,
  onChange,
  id = 'senha',
  label = 'Senha',
  mostrarForca = false,
  erro,
  autoComplete = 'new-password',
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  label?: string;
  mostrarForca?: boolean;
  erro?: string;
  autoComplete?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  const atendidas = useMemo(() => REGRAS.map((r) => r.teste(value)), [value]);
  const forca = atendidas.filter(Boolean).length;
  const rotuloForca = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][forca] ?? '';
  const cores = ['bg-ink-200', 'bg-crimson-500', 'bg-gold-400', 'bg-gold-600', 'bg-olive-500'];

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('field pr-12', erro && 'field-error')}
          autoComplete={autoComplete}
          aria-describedby={mostrarForca ? `${id}-forca` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {erro ? <p className="error-text">{erro}</p> : null}

      {mostrarForca && value ? (
        <div id={`${id}-forca`} className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < forca ? cores[forca] : 'bg-ink-100')} />
              ))}
            </div>
            <span className="text-[12px] font-medium text-ink-400">{rotuloForca}</span>
          </div>

          <ul className="mt-2.5 grid grid-cols-2 gap-1">
            {REGRAS.map((r, i) => (
              <li key={r.rotulo} className={cn('flex items-center gap-1.5 text-[12px]', atendidas[i] ? 'text-olive-600' : 'text-ink-300')}>
                {atendidas[i] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {r.rotulo}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
