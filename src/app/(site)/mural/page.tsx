import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PrayerWall } from '@/components/mural/PrayerWall';
import { Ornament } from '@/components/ui/Section';
import { lerMural, contarPedidos } from '@/lib/queries';
import { getSessionUser } from '@/lib/auth/session';
import { fingerprintDe } from '@/lib/prayer';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Mural de orações',
  description:
    'Compartilhe seu pedido de oração anonimamente e interceda por outros irmãos. Aqui ninguém carrega o peso sozinho.',
};

export const dynamic = 'force-dynamic';

export default async function MuralPage() {
  const hdrs = await headers();
  const fingerprint = fingerprintDe(
    hdrs.get('x-forwarded-for')?.split(',')[0] ?? null,
    hdrs.get('user-agent'),
    env.HASH_PEPPER,
  );

  const [mural, total, usuario] = await Promise.all([
    lerMural({ limite: 12, fingerprint }),
    contarPedidos(),
    getSessionUser().catch(() => null),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ivory-veil pb-14 pt-[calc(var(--header-h)+64px)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% -10%, rgba(241,220,156,.55), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="container relative text-center">
          <Ornament className="mb-7" />
          <p className="eyebrow mb-4">Mural de orações</p>
          <h1 className="mx-auto max-w-3xl text-display text-ink-900">
            Aqui ninguém carrega o peso <span className="text-gold-foil">sozinho</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-600">
            Escreva o que está pesando — anonimamente, sem julgamento. Outros irmãos vão ler, orar por
            você e deixar uma palavra de ânimo.
          </p>
        </div>
      </section>

      <section className="bg-ivory-50 pb-24">
        <div className="container">
          <PrayerWall
            iniciais={mural.pedidos}
            totalInicial={total}
            autenticadoComo={usuario?.fullName ?? null}
          />
        </div>
      </section>
    </>
  );
}
