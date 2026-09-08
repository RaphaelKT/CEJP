import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { IGREJA } from '@/lib/site/config';
import { GALERIA_DEMO } from '@/lib/site/media-demo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Painel visual */}
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <Image src={GALERIA_DEMO[1]!} alt="" fill priority sizes="50vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/80 to-crimson-950/60" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(200,153,43,.7), transparent 55%)' }}
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-10 w-auto" />
            <span className="leading-none">
              <span className="block font-display text-base font-semibold text-ivory-50">Missão Evangélica</span>
              <span className="text-2xs font-semibold uppercase tracking-[0.3em] text-gold-400">do Brasil</span>
            </span>
          </Link>

          <div className="max-w-md">
            <svg viewBox="0 0 24 24" className="mb-6 h-8 w-8 text-gold-400/50" fill="currentColor" aria-hidden>
              <path d="M9.6 4.5C5.5 6.6 3 10.5 3 14.7c0 2.9 1.8 4.8 4.3 4.8 2.3 0 4-1.7 4-3.9 0-2.1-1.5-3.7-3.5-3.7-.4 0-.9.1-1 .1.4-2 2.3-4.3 4.5-5.4L9.6 4.5Zm9.3 0c-4.1 2.1-6.6 6-6.6 10.2 0 2.9 1.8 4.8 4.3 4.8 2.3 0 4-1.7 4-3.9 0-2.1-1.5-3.7-3.5-3.7-.4 0-.9.1-1 .1.4-2 2.3-4.3 4.5-5.4l-1.7-2.1Z" />
            </svg>
            <p className="font-display text-2xl leading-snug text-ivory-50">
              “Porque onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.”
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
              Mateus 18:20
            </p>
          </div>

          <p className="text-[13px] text-ivory-200/45">
            {IGREJA.endereco.logradouro} · {IGREJA.endereco.bairro}
            <br />
            {IGREJA.endereco.cidade}/{IGREJA.endereco.estado}
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col bg-ivory-50">
        <div className="p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logo className="h-9 w-auto" />
            <span className="font-display text-[15px] font-semibold text-ink-900">Missão Evangélica do Brasil</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
