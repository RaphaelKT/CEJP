import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';
import { CheckoutWizard } from '@/components/eventos/CheckoutWizard';
import { lerEventoPorSlug } from '@/lib/queries';
import { getSessionUser } from '@/lib/auth/session';
import { formatDateRange } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const evento = await lerEventoPorSlug(slug);
  return { title: evento ? `Inscrição — ${evento.name}` : 'Inscrição', robots: { index: false } };
}

export default async function InscricaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lote?: string }>;
}) {
  const [{ slug }, query, usuario] = await Promise.all([params, searchParams, getSessionUser().catch(() => null)]);

  const evento = await lerEventoPorSlug(slug);
  if (!evento) notFound();

  const edicao = evento.editions[0];
  if (!edicao) notFound();

  if (edicao.status !== 'INSCRICOES_ABERTAS') {
    return (
      <section className="container flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
        <h1 className="text-headline text-ink-900">As inscrições não estão abertas</h1>
        <p className="mt-4 max-w-md text-[16px] text-ink-500">
          {edicao.status === 'INSCRICOES_EM_BREVE'
            ? 'Ainda estamos fechando a programação. Volte em breve — ou acompanhe pelo nosso Instagram.'
            : 'As inscrições para esta edição foram encerradas.'}
        </p>
        <Link href={`/eventos/${evento.slug}`} className="btn-primary mt-8">
          Voltar para o evento
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-ivory-veil pb-24 pt-[calc(var(--header-h)+48px)]">
      <div className="container">
        <div className="mb-10 text-center">
          <Link
            href={`/eventos/${evento.slug}`}
            className="mb-5 inline-flex items-center gap-2 text-[13.5px] text-ink-400 transition-colors hover:text-crimson-700"
          >
            ← {evento.name}
          </Link>
          <h1 className="text-headline text-ink-900">{edicao.title}</h1>
          <p className="mt-3 text-[15.5px] text-ink-500">
            {formatDateRange(edicao.startsAt, edicao.endsAt)} ·{' '}
            {edicao.locationLabel ?? edicao.venue?.name ?? 'Local a confirmar'}
          </p>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-400">
            <li className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-olive-500" /> Conexão criptografada</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-olive-500" /> Dados do cartão nunca tocam nossos servidores</li>
            <li className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-olive-500" /> PIX, cartão e boleto</li>
          </ul>
        </div>

        <CheckoutWizard
          evento={{ slug: evento.slug, nome: evento.name }}
          edicao={{
            slug: edicao.slug,
            titulo: edicao.title,
            parcelasMax: edicao.installmentsMax,
            inicio: edicao.startsAt.toISOString(),
            fim: edicao.endsAt.toISOString(),
            local: edicao.locationLabel ?? edicao.venue?.name ?? 'A confirmar',
          }}
          lotes={edicao.ticketTiers.map((t) => ({
            id: t.id,
            nome: t.name,
            descricao: t.description,
            precoCents: t.priceCents,
            publico: t.audience,
            vagas: t.quantityTotal > 0 ? Math.max(0, t.quantityTotal - t.quantitySold) : null,
            minPorPedido: t.minPerOrder,
            maxPorPedido: t.maxPerOrder,
            incluiHospedagem: t.includesLodging,
            incluiRefeicoes: t.includesMeals,
          }))}
          loteInicial={query.lote ?? null}
          usuario={usuario ? { nome: usuario.fullName, email: usuario.email } : null}
        />
      </div>
    </section>
  );
}
