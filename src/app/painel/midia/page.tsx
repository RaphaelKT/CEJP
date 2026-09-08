import type { Metadata } from 'next';
import { prisma, safeQuery } from '@/lib/db';
import { MediaUploader } from '@/components/painel/MediaUploader';
import { IGREJA } from '@/lib/site/config';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Enviar fotos', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PainelMidiaPage() {
  const [edicoes, locais, ultimas] = await Promise.all([
    safeQuery(
      () =>
        prisma.eventEdition.findMany({
          orderBy: [{ year: 'desc' }, { startsAt: 'desc' }],
          take: 40,
          include: { event: { select: { name: true } } },
        }),
      [],
    ),
    safeQuery(() => prisma.venue.findMany({ orderBy: { name: 'asc' } }), []),
    safeQuery(
      () =>
        prisma.mediaSubmission.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            code: true, status: true, assetCount: true, approvedCount: true,
            rejectedCount: true, validationScore: true, feedbackMessage: true, createdAt: true,
          },
        }),
      [],
    ),
  ]);

  const locaisNormalizados = locais.length
    ? locais.map((v) => ({ id: v.id, nome: v.name, cidade: `${v.city}/${v.state}`, cep: v.postalCode }))
    : [
        {
          id: 'sede',
          nome: `${IGREJA.nome} — Templo Sede`,
          cidade: `${IGREJA.endereco.cidade}/${IGREJA.endereco.estado}`,
          cep: IGREJA.endereco.cep,
        },
      ];

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">Equipe de mídia</p>
        <h1 className="font-display text-3xl text-ink-900">Publicar fotos nos eventos</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Preencha o relatório e envie as fotos. O sistema confere a localização e a data de cada
          imagem contra o evento informado — se algo não bater, a foto não entra no site e você
          recebe exatamente qual campo revisar.
        </p>
      </header>

      <MediaUploader
        edicoes={edicoes.map((e) => ({
          id: e.id,
          rotulo: `${e.event.name} ${e.year}`,
          ano: e.year,
          inicio: e.startsAt.toISOString(),
          fim: e.endsAt.toISOString(),
          venueId: e.venueId,
        }))}
        locais={locaisNormalizados}
        limiteMb={env.MEDIA_MAX_MB}
        historico={ultimas.map((s) => ({
          code: s.code,
          status: s.status,
          total: s.assetCount,
          aprovadas: s.approvedCount,
          reprovadas: s.rejectedCount,
          score: s.validationScore,
          mensagem: s.feedbackMessage,
          criadoEm: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
