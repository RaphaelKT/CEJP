'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight, UserRound, LogOut, LayoutDashboard } from 'lucide-react';
import { Logo, Wordmark } from '@/components/ui/Logo';
import { NAV_PRINCIPAL } from '@/lib/site/config';
import { cn } from '@/lib/utils/cn';

type Usuario = { fullName: string; roles: string[] } | null;

export function Header({ usuario }: { usuario: Usuario }) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  const temPainel = usuario?.roles.some((r) => r !== 'VISITANTE' && r !== 'MEMBRO');

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-expo',
          rolou ? 'glass border-b border-ink-100/60 shadow-soft' : 'bg-transparent',
        )}
        style={{ height: 'var(--header-h)' }}
      >
        <div className="container flex h-full items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Início">
            <Logo className="h-9 w-auto" />
            <Wordmark className="hidden sm:flex" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {NAV_PRINCIPAL.map((item) => {
              const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-[14.5px] font-medium transition-colors duration-300',
                    ativo ? 'text-crimson-700' : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {item.label}
                  {ativo ? (
                    <motion.span
                      layoutId="nav-ativo"
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gold-sheen"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {usuario ? (
              <div className="hidden items-center gap-2 sm:flex">
                {temPainel ? (
                  <Link href="/painel" className="btn-ghost !px-3 !py-2 text-[13.5px]">
                    <LayoutDashboard className="h-4 w-4" /> Painel
                  </Link>
                ) : null}
                <Link
                  href="/minha-conta"
                  className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-2 text-[13.5px] font-medium text-ink-700 transition-colors hover:border-gold-300"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-crimson-700 text-[10px] font-bold text-white">
                    {usuario.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  {usuario.fullName.split(' ')[0]}
                </Link>
                <form action="/api/auth/sair" method="post">
                  <button className="btn-ghost !p-2" aria-label="Sair" title="Sair">
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/entrar" className="btn-ghost !px-4 !py-2 text-[13.5px]">
                  <UserRound className="h-4 w-4" /> Entrar
                </Link>
                <Link href="/cadastro" className="btn-primary !px-5 !py-2.5 text-[13.5px]">
                  Criar conta
                </Link>
              </div>
            )}

            <button
              onClick={() => setAberto((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-full border border-ink-100 bg-white/80 text-ink-800 transition-colors hover:border-gold-300 lg:hidden"
              aria-expanded={aberto}
              aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            >
              {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {aberto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-ivory-50 lg:hidden"
          >
            <div className="container flex h-full flex-col pt-[calc(var(--header-h)+24px)] pb-10">
              <nav className="flex flex-col" aria-label="Navegação móvel">
                {NAV_PRINCIPAL.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center justify-between border-b border-ink-100 py-5 font-display text-2xl text-ink-900"
                    >
                      {item.label}
                      <ChevronRight className="h-5 w-5 text-gold-500" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto grid gap-3 pt-8">
                {usuario ? (
                  <>
                    <Link href="/minha-conta" className="btn-outline w-full">
                      Minha conta
                    </Link>
                    <form action="/api/auth/sair" method="post">
                      <button className="btn-ghost w-full">Sair</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/cadastro" className="btn-primary w-full">
                      Criar minha conta
                    </Link>
                    <Link href="/entrar" className="btn-outline w-full">
                      Já sou cadastrado
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
