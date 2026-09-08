import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Ornament } from '@/components/ui/Section';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory-veil px-6 text-center">
      <Link href="/" className="mb-10">
        <Logo className="h-14 w-auto" />
      </Link>
      <Ornament className="mb-7" />
      <p className="eyebrow mb-3">Erro 404</p>
      <h1 className="text-headline text-ink-900">Esta página não existe</h1>
      <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-ink-500">
        O endereço pode ter mudado ou o link estar incompleto. Mas já que você chegou até aqui, que
        tal conhecer a nossa casa?
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Voltar ao início</Link>
        <Link href="/cultos" className="btn-outline">Ver a programação</Link>
      </div>
    </main>
  );
}
