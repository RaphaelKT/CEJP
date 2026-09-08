import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckInPanel } from '@/components/CheckInPanel';
import { Ornament } from '@/components/ui/Section';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Registrar presença', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PresencaPage() {
  const usuario = await getSessionUser().catch(() => null);
  if (!usuario) redirect('/entrar?proximo=/presenca');

  return (
    <section className="bg-ivory-veil pb-24 pt-[calc(var(--header-h)+56px)]">
      <div className="container max-w-lg">
        <div className="text-center">
          <Ornament className="mb-6" />
          <p className="eyebrow mb-3">Presença</p>
          <h1 className="text-headline text-ink-900">Que bom que você veio</h1>
          <p className="mx-auto mt-4 max-w-sm text-[15.5px] leading-relaxed text-ink-600">
            Aponte a câmera para o QR do telão ou digite o código exibido. Sua presença conta para o
            reconhecimento da sua membresia.
          </p>
        </div>

        <div className="mt-8">
          <CheckInPanel nome={usuario.fullName.split(' ')[0]!} />
        </div>
      </div>
    </section>
  );
}
