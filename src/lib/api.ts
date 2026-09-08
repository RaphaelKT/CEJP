import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthorizationError } from '@/lib/auth/session';
import { CheckoutError } from '@/lib/payments/service';
import { fieldErrors } from '@/lib/validation';
import { anonymizeIp } from '@/lib/auth/crypto';

/** Resposta de erro padronizada em português. */
export function erro(mensagem: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, erro: mensagem, ...extra }, { status });
}

export function ok<T extends Record<string, unknown>>(dados: T, status = 200) {
  return NextResponse.json({ ok: true, ...dados }, { status });
}

/** Converte exceções conhecidas na resposta HTTP adequada. */
export function tratarErro(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json({ ok: false, erro: 'Confira os campos destacados.', campos: fieldErrors(e) }, { status: 422 });
  }
  if (e instanceof AuthorizationError) return erro(e.message, 401);
  if (e instanceof CheckoutError) return erro(e.message, e.status, { codigo: e.code });
  if (e instanceof Error && e.message.includes('Unique constraint')) {
    return erro('Já existe um registro com estes dados.', 409);
  }
  // eslint-disable-next-line no-console
  console.error('[api] erro não tratado:', e);
  return erro('Algo deu errado do nosso lado. Tente novamente em instantes.', 500);
}

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */

type Janela = { contagem: number; expiraEm: number };
const globalForLimit = globalThis as unknown as { __mebLimits?: Map<string, Janela> };
const janelas = globalForLimit.__mebLimits ?? new Map<string, Janela>();
globalForLimit.__mebLimits = janelas;

/**
 * Limitador de taxa em memória (janela deslizante simples).
 * Suficiente para uma instância; em cluster, trocar por Redis mantendo
 * esta mesma assinatura.
 */
export function limitar(chave: string, maximo: number, janelaMs: number) {
  const agora = Date.now();
  const atual = janelas.get(chave);

  if (!atual || atual.expiraEm < agora) {
    janelas.set(chave, { contagem: 1, expiraEm: agora + janelaMs });
    return { permitido: true, restante: maximo - 1, resetEm: agora + janelaMs };
  }
  atual.contagem += 1;
  const permitido = atual.contagem <= maximo;
  return { permitido, restante: Math.max(0, maximo - atual.contagem), resetEm: atual.expiraEm };
}

/** Limpeza preguiçosa para não crescer indefinidamente. */
setInterval(() => {
  const agora = Date.now();
  for (const [k, v] of janelas) if (v.expiraEm < agora) janelas.delete(k);
}, 60_000).unref?.();

export function ipDe(req: Request) {
  const h = req.headers;
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? '0.0.0.0';
}

export function ipHashDe(req: Request) {
  return anonymizeIp(ipDe(req));
}

export function respostaLimite(resetEm: number) {
  const segundos = Math.max(1, Math.ceil((resetEm - Date.now()) / 1000));
  return NextResponse.json(
    { ok: false, erro: `Muitas tentativas. Aguarde ${segundos}s e tente novamente.` },
    { status: 429, headers: { 'Retry-After': String(segundos) } },
  );
}
