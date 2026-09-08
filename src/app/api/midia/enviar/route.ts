import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { erro, tratarErro } from '@/lib/api';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { mediaReportSchema } from '@/lib/validation';
import { consolidarLote, validarFoto, type ResultadoValidacaoAsset } from '@/lib/media/validation';
import { storage, validarArquivo } from '@/lib/media/storage';
import { publish } from '@/lib/realtime/bus';
import { env } from '@/lib/env';
import { IGREJA } from '@/lib/site/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Recebimento do lote da equipe de mídia.
 *
 * Fluxo: relatório (menus suspensos) + arquivos → validação foto a foto →
 * consolidação → publicação automática, fila humana ou devolução com a
 * indicação exata do campo a corrigir.
 */
export async function POST(req: Request) {
  try {
    const usuario = await requirePermission(PERMISSIONS.MIDIA_ENVIAR);

    const form = await req.formData();
    const relatorioBruto = form.get('relatorio');
    if (typeof relatorioBruto !== 'string') return erro('Relatório ausente.', 422);

    const relatorio = mediaReportSchema.parse(JSON.parse(relatorioBruto));
    const arquivos = form.getAll('fotos').filter((f): f is File => f instanceof File);

    if (!arquivos.length) return erro('Selecione pelo menos uma foto.', 422);
    if (arquivos.length > 60) return erro('Envie no máximo 60 fotos por relatório.', 422);

    for (const arquivo of arquivos) {
      const problema = validarArquivo(arquivo);
      if (problema) return erro(problema, 422);
    }

    // Local declarado no relatório — base da comparação geoespacial.
    const local = await prisma.venue.findUnique({ where: { id: relatorio.venueId } });
    const venue = local ?? {
      name: IGREJA.nome,
      latitude: env.HQ_LATITUDE,
      longitude: env.HQ_LONGITUDE,
      postalCode: IGREJA.endereco.cep,
      city: IGREJA.endereco.cidade,
      geofenceRadiusM: env.HQ_GEOFENCE_RADIUS_M,
    };

    const edicao = relatorio.editionId
      ? await prisma.eventEdition.findUnique({ where: { id: relatorio.editionId }, select: { startsAt: true, endsAt: true, id: true } })
      : null;

    // Acervo já publicado — detecção de reenvio.
    const publicados = await prisma.mediaAsset.findMany({
      where: { status: { in: ['PUBLICADO', 'VALIDADO'] } },
      select: { perceptualHash: true, sha256: true },
      take: 5000,
    });
    const hashesArquivo = new Set(publicados.map((a) => a.sha256).filter((h): h is string => Boolean(h)));
    const hashesPerceptuais = new Set(
      publicados.map((a) => a.perceptualHash).filter((h): h is string => Boolean(h)),
    );

    const submissao = await prisma.mediaSubmission.create({
      data: {
        code: `MID-${Date.now().toString(36).toUpperCase()}`,
        submitterId: usuario.id,
        status: 'EM_VALIDACAO',
        editionId: edicao?.id,
        contextKind: relatorio.contextKind,
        occurrenceLabel: relatorio.occurrenceLabel,
        eventYear: relatorio.eventYear,
        capturedOn: new Date(relatorio.capturedOn),
        venueId: local?.id,
        photographer: relatorio.photographer,
        caption: relatorio.caption,
        tags: relatorio.tags,
        hasMinors: relatorio.hasMinors,
        consentConfirmed: relatorio.consentConfirmed,
        assetCount: arquivos.length,
        submittedAt: new Date(),
      },
    });

    const resultados: ResultadoValidacaoAsset[] = [];
    const salvos: { id: string; url: string; veredito: string; mensagem?: string }[] = [];

    for (const arquivo of arquivos) {
      const buffer = Buffer.from(await arquivo.arrayBuffer());

      const validacao = await validarFoto(buffer, {
        venue: {
          latitude: venue.latitude,
          longitude: venue.longitude,
          name: venue.name,
          postalCode: venue.postalCode,
          city: venue.city,
          geofenceRadiusM: venue.geofenceRadiusM,
        },
        capturedOn: new Date(relatorio.capturedOn),
        eventWindow: edicao ? { startsAt: edicao.startsAt, endsAt: edicao.endsAt } : undefined,
        hashesArquivo,
        hashesPerceptuais,
        reverseGeocodeHabilitado: true,
      });
      resultados.push(validacao);

      // Só persistimos o arquivo quando ele não foi reprovado — economia de
      // armazenamento e nada de conteúdo inválido no bucket público.
      let url = '';
      let storageKey = '';
      if (validacao.veredito !== 'REPROVADO') {
        const salvo = await storage().salvar(buffer, arquivo.name, arquivo.type);
        url = salvo.url;
        storageKey = salvo.storageKey;
        // Também bloqueia duplicidade dentro do próprio lote.
        if (validacao.perceptualHash) hashesPerceptuais.add(validacao.perceptualHash);
        hashesArquivo.add(validacao.sha256);
      }

      const asset = await prisma.mediaAsset.create({
        data: {
          submissionId: submissao.id,
          status:
            validacao.veredito === 'APROVADO'
              ? 'VALIDADO'
              : validacao.veredito === 'REVISAO'
                ? 'PROCESSANDO'
                : 'REPROVADO',
          storageKey,
          url,
          mimeType: arquivo.type,
          sizeBytes: arquivo.size,
          width: validacao.exif.width,
          height: validacao.exif.height,
          perceptualHash: validacao.perceptualHash,
          sha256: validacao.sha256,
          capturedAt: validacao.exif.capturedAt,
          cameraMake: validacao.exif.cameraMake,
          cameraModel: validacao.exif.cameraModel,
          exifLatitude: validacao.exif.latitude,
          exifLongitude: validacao.exif.longitude,
          exifAltitude: validacao.exif.altitude,
          hasGps: validacao.exif.latitude != null,
          distanceToVenueM: validacao.distanceToVenueM,
          validationSignals: validacao.sinais as unknown as Prisma.InputJsonValue,
          validationScore: validacao.score,
          rejectionCode: validacao.rejectionCode,
          rejectionMessage: validacao.rejectionMessage,
          autoTags: relatorio.tags,
          altText: relatorio.caption,
        },
      });

      salvos.push({
        id: asset.id,
        url,
        veredito: validacao.veredito,
        mensagem: validacao.rejectionMessage,
      });
    }

    const consolidado = consolidarLote(resultados);

    await prisma.mediaSubmission.update({
      where: { id: submissao.id },
      data: {
        status: consolidado.veredito,
        approvedCount: consolidado.aprovadas,
        rejectedCount: consolidado.reprovadas,
        validationScore: consolidado.score,
        validationReport: consolidado as unknown as Prisma.InputJsonValue,
        feedbackMessage: consolidado.mensagem,
        publishedAt: consolidado.veredito === 'APROVADO_AUTOMATICO' ? new Date() : null,
      },
    });

    // Publicação automática das aprovadas na galeria da edição.
    if (consolidado.aprovadas > 0 && edicao) {
      const galeria = await prisma.gallery.upsert({
        where: { slug: `${relatorio.editionId}-${relatorio.eventYear}` },
        create: {
          slug: `${relatorio.editionId}-${relatorio.eventYear}`,
          title: `Galeria ${relatorio.eventYear}`,
          editionId: edicao.id,
          year: relatorio.eventYear,
          published: true,
        },
        update: { published: true },
      });

      const aprovados = await prisma.mediaAsset.findMany({
        where: { submissionId: submissao.id, status: 'VALIDADO' },
        select: { id: true },
      });

      await prisma.$transaction([
        prisma.galleryItem.createMany({
          data: aprovados.map((a, i) => ({ galleryId: galeria.id, assetId: a.id, order: i, caption: relatorio.caption })),
          skipDuplicates: true,
        }),
        prisma.mediaAsset.updateMany({
          where: { id: { in: aprovados.map((a) => a.id) } },
          data: { status: 'PUBLICADO' },
        }),
      ]);

      if (!galeria.coverUrl && salvos[0]?.url) {
        await prisma.gallery.update({ where: { id: galeria.id }, data: { coverUrl: salvos[0].url } });
      }
    }

    // Fila humana quando houver dúvida.
    if (consolidado.veredito !== 'APROVADO_AUTOMATICO') {
      await prisma.moderationCase.create({
        data: {
          entityType: 'media_submission',
          entityId: submissao.id,
          reason: consolidado.reprovadas === resultados.length ? 'lote_reprovado' : 'revisao_parcial',
          signals: { campos: consolidado.campos, score: consolidado.score } as Prisma.InputJsonValue,
        },
      });
    }

    publish('midia', { submissao: submissao.code, veredito: consolidado.veredito, aprovadas: consolidado.aprovadas });

    return NextResponse.json(
      {
        ok: consolidado.veredito !== 'REPROVADO',
        submissao: submissao.code,
        veredito: consolidado.veredito,
        mensagem: consolidado.mensagem,
        resumo: {
          total: consolidado.total,
          aprovadas: consolidado.aprovadas,
          emRevisao: consolidado.revisao,
          reprovadas: consolidado.reprovadas,
          score: consolidado.score,
        },
        camposParaRevisar: consolidado.campos,
        fotos: salvos,
        detalhes: resultados.map((r, i) => ({
          arquivo: arquivos[i]?.name,
          score: r.score,
          veredito: r.veredito,
          sinais: r.sinais,
        })),
      },
      { status: consolidado.veredito === 'REPROVADO' ? 422 : 201 },
    );
  } catch (e) {
    return tratarErro(e);
  }
}
