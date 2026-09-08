import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, Camera, UsersRound, Wallet, HandHeart, LogOut, ArrowLeft, QrCode,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { getSessionUser } from '@/lib/auth/session';
import { permissionsFor, PERMISSIONS, ROLE_LABELS } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

const ITENS = [
  { href: '/painel', label: 'Visão geral', Icon: LayoutDashboard, permissao: PERMISSIONS.PAINEL_ACESSAR },
  { href: '/painel/totem', label: 'Totem de presença', Icon: QrCode, permissao: PERMISSIONS.PRESENCA_REGISTRAR },
  { href: '/painel/midia', label: 'Enviar fotos', Icon: Camera, permissao: PERMISSIONS.MIDIA_ENVIAR },
  { href: '/painel/membresia', label: 'Membresia', Icon: UsersRound, permissao: PERMISSIONS.MEMBRESIA_APROVAR },
  { href: '/painel/mural', label: 'Moderação do mural', Icon: HandHeart, permissao: PERMISSIONS.MURAL_MODERAR },
  { href: '/painel/financeiro', label: 'Financeiro', Icon: Wallet, permissao: PERMISSIONS.FINANCEIRO_LER },
] as const;

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser().catch(() => null);
  if (!usuario) redirect('/entrar?proximo=/painel');

  const permissoes = permissionsFor(usuario.roles);
  if (!permissoes.has(PERMISSIONS.PAINEL_ACESSAR)) redirect('/minha-conta');

  const visiveis = ITENS.filter((i) => permissoes.has(i.permissao));
  const papelPrincipal = usuario.roles.find((r) => r !== 'VISITANTE' && r !== 'MEMBRO') ?? usuario.roles[0]!;

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white lg:flex">
        <div className="border-b border-ink-100 p-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-auto" />
            <span className="leading-none">
              <span className="block font-display text-[13.5px] font-semibold text-ink-900">Painel MEB</span>
              <span className="text-2xs uppercase tracking-[0.16em] text-gold-600">Área interna</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visiveis.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-ink-600 transition-colors hover:bg-gold-50 hover:text-ink-900"
            >
              <Icon className="h-[18px] w-[18px] text-gold-600" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="mb-2 rounded-xl bg-ivory-100 p-3.5">
            <p className="truncate text-[13.5px] font-semibold text-ink-900">{usuario.fullName}</p>
            <p className="mt-0.5 text-[12px] text-ink-400">{ROLE_LABELS[papelPrincipal]}</p>
          </div>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] text-ink-500 transition-colors hover:bg-ink-50">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          <form action="/api/auth/sair" method="post">
            <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] text-ink-500 transition-colors hover:bg-ink-50">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink-100 bg-white/85 px-5 py-3.5 backdrop-blur lg:hidden">
          <Link href="/painel" className="flex items-center gap-2.5">
            <Logo className="h-7 w-auto" />
            <span className="font-display text-[14px] font-semibold text-ink-900">Painel MEB</span>
          </Link>
          <nav className="flex gap-1">
            {visiveis.map(({ href, Icon, label }) => (
              <Link key={href} href={href} aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-gold-50">
                <Icon className="h-[18px] w-[18px]" />
              </Link>
            ))}
          </nav>
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
