import 'server-only';
import exifr from 'exifr';
import sharp from 'sharp';
import { sha256 } from '@/lib/auth/crypto';
import { haversineMeters, normalizePostalCode, reverseGeocode, type Coord } from '@/lib/utils/geo';

/**
 * Pipeline de validação das fotos enviadas pela equipe de mídia.
 *
 * O objetivo não é "adivinhar" se a foto é boa, e sim garantir que ela
 * pertence ao evento declarado no relatório. Cada sinal contribui com um
 * peso; o total define se a foto entra direto na galeria, vai para a fila
 * humana ou é devolvida com um erro que diz exatamente qual campo revisar.
 */

export type SinalValidacao = {
  chave: string;
  rotulo: string;
  peso: number;
  pontos: number;
  status: 'ok' | 'alerta' | 'falha' | 'indisponivel';
  detalhe: string;
};

export type ContextoValidacao = {
  /** Local declarado no relatório (menu suspenso). */
  venue: Coord & { name: string; postalCode: string; city: string; geofenceRadiusM: number };
  /** Data declarada no relatório. */
  capturedOn: Date;
  /** Janela do evento declarado (quando houver edição vinculada). */
  eventWindow?: { startsAt: Date; endsAt: Date };
  /** SHA-256 dos arquivos já recebidos — detecta reenvio do mesmo arquivo. */
  hashesArquivo?: Set<string>;
  /** pHashes já publicados — detecta a mesma imagem salva/recomprimida de novo. */
  hashesPerceptuais?: Set<string>;
  /** Desliga a chamada de rede em ambientes sem internet. */
  reverseGeocodeHabilitado?: boolean;
};

export type ResultadoValidacaoAsset = {
  score: number;
  veredito: 'APROVADO' | 'REVISAO' | 'REPROVADO';
  sinais: SinalValidacao[];
  exif: {
    capturedAt: Date | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    cameraMake: string | null;
    cameraModel: string | null;
    width: number | null;
    height: number | null;
  };
  sha256: string;
  perceptualHash: string | null;
  distanceToVenueM: number | null;
  rejectionCode?: string;
  rejectionMessage?: string;
  camposParaRevisar: string[];
};

const PESOS = {
  gps: 40,
  data: 25,
  duplicidade: 15,
  qualidade: 10,
  dispositivo: 10,
} as const;

const LIMIAR_APROVACAO = 75;
const LIMIAR_REVISAO = 45;

export async function validarFoto(
  buffer: Buffer,
  ctx: ContextoValidacao,
): Promise<ResultadoValidacaoAsset> {
  const sinais: SinalValidacao[] = [];
  const camposParaRevisar = new Set<string>();

  const exif = await lerExif(buffer);
  const hashArquivo = sha256(buffer);
  const pHash = await calcularPerceptualHash(buffer);

  // O EXIF pode não trazer dimensões (ou trazê-las erradas após edição);
  // as do decodificador são a fonte confiável.
  const dimensoes = await lerDimensoes(buffer);
  if (dimensoes) {
    exif.width = dimensoes.width;
    exif.height = dimensoes.height;
  }

  /* --------------------------- Sinal 1: GPS --------------------------- */
  let distancia: number | null = null;
  if (exif.latitude != null && exif.longitude != null) {
    distancia = haversineMeters({ latitude: exif.latitude, longitude: exif.longitude }, ctx.venue);
    const raio = ctx.venue.geofenceRadiusM;

    if (distancia <= raio) {
      sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, PESOS.gps, 'ok', `Foto tirada a ${Math.round(distancia)} m de ${ctx.venue.name}.`));
    } else if (distancia <= raio * 4) {
      sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, Math.round(PESOS.gps * 0.45), 'alerta', `Foto a ${Math.round(distancia)} m do local declarado — dentro da região, mas fora da área do evento.`));
      camposParaRevisar.add('venueId');
    } else {
      // Segundo sinal: onde o GPS realmente aponta? (geocodificação reversa)
      let ondeFoiTirada = '';
      if (ctx.reverseGeocodeHabilitado !== false) {
        try {
          const local = await reverseGeocode({ latitude: exif.latitude, longitude: exif.longitude });
          const cepFoto = normalizePostalCode(local.postalCode);
          const cepLocal = normalizePostalCode(ctx.venue.postalCode);
          const mesmoCep = cepFoto.length === 8 && cepFoto === cepLocal;
          ondeFoiTirada = local.city ? ` A imagem aponta para ${[local.suburb, local.city, local.state].filter(Boolean).join(', ')}${local.postalCode ? ` (CEP ${local.postalCode})` : ''}.` : '';
          if (mesmoCep) {
            sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, Math.round(PESOS.gps * 0.6), 'alerta', `Coordenada distante, mas o CEP confere com ${ctx.venue.name}.`));
          } else {
            sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, 0, 'falha', `Foto tirada a ${(distancia / 1000).toFixed(1)} km do local declarado.${ondeFoiTirada}`));
            camposParaRevisar.add('venueId');
          }
        } catch {
          sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, 0, 'falha', `Foto tirada a ${(distancia / 1000).toFixed(1)} km do local declarado.`));
          camposParaRevisar.add('venueId');
        }
      } else {
        sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, 0, 'falha', `Foto tirada a ${(distancia / 1000).toFixed(1)} km do local declarado.`));
        camposParaRevisar.add('venueId');
      }
    }
  } else {
    // Sem GPS (comum quando o celular tem geotag desligado ou a foto passou
    // por WhatsApp). Não reprovamos: encaminhamos para conferência humana.
    sinais.push(sinal('gps', 'Localização da foto', PESOS.gps, Math.round(PESOS.gps * 0.5), 'indisponivel', 'A foto não traz coordenadas (geotag desligada ou removida pelo app de envio). Enviaremos para conferência.'));
  }

  /* --------------------------- Sinal 2: Data -------------------------- */
  if (exif.capturedAt) {
    const diffDias = Math.abs(exif.capturedAt.getTime() - ctx.capturedOn.getTime()) / 86_400_000;
    const dentroDoEvento =
      ctx.eventWindow &&
      exif.capturedAt >= new Date(ctx.eventWindow.startsAt.getTime() - 86_400_000) &&
      exif.capturedAt <= new Date(ctx.eventWindow.endsAt.getTime() + 86_400_000);

    if (dentroDoEvento || diffDias <= 1) {
      sinais.push(sinal('data', 'Data da captura', PESOS.data, PESOS.data, 'ok', `Foto tirada em ${exif.capturedAt.toLocaleDateString('pt-BR')}, compatível com o relatório.`));
    } else if (diffDias <= 7) {
      sinais.push(sinal('data', 'Data da captura', PESOS.data, Math.round(PESOS.data * 0.5), 'alerta', `A foto é de ${exif.capturedAt.toLocaleDateString('pt-BR')}, ${Math.round(diffDias)} dias fora da data informada.`));
      camposParaRevisar.add('capturedOn');
    } else {
      sinais.push(sinal('data', 'Data da captura', PESOS.data, 0, 'falha', `A foto é de ${exif.capturedAt.toLocaleDateString('pt-BR')} e o relatório informa ${ctx.capturedOn.toLocaleDateString('pt-BR')}.`));
      camposParaRevisar.add('capturedOn');
      camposParaRevisar.add('editionId');
    }
  } else {
    sinais.push(sinal('data', 'Data da captura', PESOS.data, Math.round(PESOS.data * 0.5), 'indisponivel', 'A foto não traz data de captura no EXIF.'));
  }

  /* ----------------------- Sinal 3: Duplicidade ----------------------- */
  // Arquivo idêntico (SHA-256) ou imagem visualmente igual (pHash).
  const arquivoIdentico = ctx.hashesArquivo?.has(hashArquivo) ?? false;
  const imagemSimilar =
    !arquivoIdentico &&
    pHash != null &&
    [...(ctx.hashesPerceptuais ?? [])].some(
      (conhecido) => distanciaHamming(conhecido, pHash) <= LIMIAR_SIMILARIDADE,
    );

  if (arquivoIdentico) {
    // Arquivo byte a byte idêntico: certeza absoluta, reprova direto.
    sinais.push(
      sinal('duplicidade', 'Originalidade', PESOS.duplicidade, 0, 'falha', 'Este arquivo já foi enviado antes.'),
    );
  } else if (imagemSimilar) {
    // Semelhança perceptual é indício, não prova: duas fotos da mesma cena,
    // tiradas em rajada, são legitimamente parecidas. Vai para conferência
    // humana em vez de ser descartada.
    sinais.push(
      sinal('duplicidade', 'Originalidade', PESOS.duplicidade, Math.round(PESOS.duplicidade * 0.4), 'alerta',
        'Muito parecida com uma imagem já publicada — enviada para conferência.'),
    );
  } else {
    sinais.push(sinal('duplicidade', 'Originalidade', PESOS.duplicidade, PESOS.duplicidade, 'ok', 'Imagem inédita no acervo.'));
  }

  /* ------------------------ Sinal 4: Qualidade ------------------------ */
  const megapixels = exif.width && exif.height ? (exif.width * exif.height) / 1_000_000 : null;
  if (megapixels == null) {
    sinais.push(sinal('qualidade', 'Resolução', PESOS.qualidade, Math.round(PESOS.qualidade * 0.6), 'indisponivel', 'Não foi possível ler as dimensões.'));
  } else if (megapixels >= 1.2) {
    sinais.push(sinal('qualidade', 'Resolução', PESOS.qualidade, PESOS.qualidade, 'ok', `${megapixels.toFixed(1)} MP — adequada para a galeria.`));
  } else {
    sinais.push(sinal('qualidade', 'Resolução', PESOS.qualidade, 0, 'alerta', `${megapixels.toFixed(1)} MP — resolução baixa para publicação.`));
  }

  /* ----------------------- Sinal 5: Dispositivo ----------------------- */
  if (exif.cameraMake || exif.cameraModel) {
    sinais.push(sinal('dispositivo', 'Origem do arquivo', PESOS.dispositivo, PESOS.dispositivo, 'ok', `Capturada com ${[exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ')}.`));
  } else {
    sinais.push(sinal('dispositivo', 'Origem do arquivo', PESOS.dispositivo, Math.round(PESOS.dispositivo * 0.4), 'indisponivel', 'Sem identificação de câmera (possível captura de tela ou reencode).'));
  }

  const score = Math.min(100, sinais.reduce((acc, s) => acc + s.pontos, 0));
  const temFalhaCritica = sinais.some((s) => s.status === 'falha' && (s.chave === 'gps' || s.chave === 'duplicidade'));

  const veredito: ResultadoValidacaoAsset['veredito'] = temFalhaCritica
    ? 'REPROVADO'
    : score >= LIMIAR_APROVACAO
      ? 'APROVADO'
      : score >= LIMIAR_REVISAO
        ? 'REVISAO'
        : 'REPROVADO';

  const falha = sinais.find((s) => s.status === 'falha');

  return {
    score,
    veredito,
    sinais,
    exif,
    sha256: hashArquivo,
    perceptualHash: pHash,
    distanceToVenueM: distancia,
    rejectionCode: veredito === 'REPROVADO' ? (falha?.chave ?? 'score_baixo') : undefined,
    rejectionMessage: veredito === 'REPROVADO' ? (falha?.detalhe ?? 'A foto não passou na conferência automática.') : undefined,
    camposParaRevisar: [...camposParaRevisar],
  };
}

function sinal(
  chave: string,
  rotulo: string,
  peso: number,
  pontos: number,
  status: SinalValidacao['status'],
  detalhe: string,
): SinalValidacao {
  return { chave, rotulo, peso, pontos, status, detalhe };
}

async function lerExif(buffer: Buffer) {
  const vazio = {
    capturedAt: null,
    latitude: null,
    longitude: null,
    altitude: null,
    cameraMake: null,
    cameraModel: null,
    width: null,
    height: null,
  };

  try {
    // Importante: NÃO usar a opção `pick` aqui.
    // `latitude`/`longitude` não são tags do arquivo — são valores que o
    // exifr calcula a partir de GPSLatitude + GPSLatitudeRef. Com `pick`
    // ativo esse cálculo é pulado e toda foto parece "sem geotag",
    // desativando silenciosamente a validação de local.
    const dados = (await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      exif: true,
    })) as Record<string, unknown> | undefined;

    if (!dados) return vazio;

    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const dataBruta = (dados.DateTimeOriginal ?? dados.CreateDate ?? dados.ModifyDate) as
      | Date
      | string
      | undefined;

    const capturedAt = dataBruta ? new Date(dataBruta) : null;

    return {
      capturedAt: capturedAt && !Number.isNaN(capturedAt.getTime()) ? capturedAt : null,
      latitude: num(dados.latitude),
      longitude: num(dados.longitude),
      altitude: num(dados.GPSAltitude),
      cameraMake: texto(dados.Make),
      cameraModel: texto(dados.Model),
      width: num(dados.ExifImageWidth) ?? num(dados.ImageWidth),
      height: num(dados.ExifImageHeight) ?? num(dados.ImageHeight) ?? num(dados.ImageLength),
    };
  } catch {
    return vazio;
  }
}

/** Dimensões reais da imagem, lidas do decodificador. */
async function lerDimensoes(buffer: Buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) return null;
    // `autoOrient` já é considerado pelo sharp ao ler a orientação EXIF.
    return { width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

/**
 * Hash perceptual (average hash, 8×8).
 *
 * A imagem é decodificada, reduzida a 8×8 tons de cinza e cada pixel vira
 * um bit conforme esteja acima ou abaixo da média. O resultado descreve a
 * *aparência* da foto, não os seus bytes: sobrevive a recompressão, troca
 * de formato e redimensionamento — exatamente os casos em que o SHA-256
 * muda mas a foto é a mesma.
 *
 * Fotos parecidas ficam a poucos bits de distância; use `distanciaHamming`
 * com o limiar `LIMIAR_SIMILARIDADE` para decidir se são a mesma imagem.
 */
export async function calcularPerceptualHash(buffer: Buffer): Promise<string | null> {
  try {
    const pixels = await sharp(buffer)
      .greyscale()
      .resize(8, 8, { fit: 'fill', kernel: 'cubic' })
      .raw()
      .toBuffer();

    if (pixels.length < 64) return null;

    let soma = 0;
    for (let i = 0; i < 64; i++) soma += pixels[i]!;
    const media = soma / 64;

    // Guarda de contraste.
    //
    // Imagens muito uniformes (um fundo liso, uma parede, um slide branco)
    // reduzem a quase nada depois do 8×8: qualquer par delas colide, e o
    // resultado seria acusar fotos legítimas e diferentes de duplicidade.
    // Nesses casos devolvemos null — a checagem cai para o SHA-256, que é
    // exato, em vez de arriscar um falso positivo contra a equipe de mídia.
    let variancia = 0;
    for (let i = 0; i < 64; i++) variancia += (pixels[i]! - media) ** 2;
    const desvioPadrao = Math.sqrt(variancia / 64);
    if (desvioPadrao < DESVIO_MINIMO_PHASH) return null;

    let bits = '';
    for (let i = 0; i < 64; i++) bits += pixels[i]! >= media ? '1' : '0';

    return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
  } catch {
    return null;
  }
}

/** Desvio padrão mínimo (0-255) para o pHash ser considerado discriminativo. */
const DESVIO_MINIMO_PHASH = 12;

/**
 * Abaixo de quantos bits de diferença duas imagens são consideradas a mesma.
 * 5/64 tolera recompressão e pequenos recortes sem gerar falso positivo
 * entre fotos diferentes da mesma cena.
 */
export const LIMIAR_SIMILARIDADE = 5;

/** Distância de Hamming entre dois pHashes (0 = idênticos). */
export function distanciaHamming(a: string, b: string) {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let dist = 0;
  while (x) {
    dist += Number(x & 1n);
    x >>= 1n;
  }
  return dist;
}

/**
 * Consolida os resultados de um lote e escreve a mensagem devolvida à
 * equipe — sempre apontando o campo do relatório que precisa ser corrigido.
 */
export function consolidarLote(resultados: ResultadoValidacaoAsset[]) {
  const total = resultados.length;
  const aprovadas = resultados.filter((r) => r.veredito === 'APROVADO').length;
  const revisao = resultados.filter((r) => r.veredito === 'REVISAO').length;
  const reprovadas = resultados.filter((r) => r.veredito === 'REPROVADO').length;
  const score = total ? Math.round(resultados.reduce((a, r) => a + r.score, 0) / total) : 0;

  const campos = new Map<string, number>();
  for (const r of resultados) for (const c of r.camposParaRevisar) campos.set(c, (campos.get(c) ?? 0) + 1);

  const rotulos: Record<string, string> = {
    venueId: 'Local da captação',
    capturedOn: 'Data das fotos',
    editionId: 'Evento / edição',
    eventYear: 'Ano do evento',
  };

  // Quantas fotos chegaram sem metadados? Muda completamente a orientação
  // que devolvemos: não há campo do relatório para corrigir — o problema é
  // o arquivo, que provavelmente passou por um app de mensagens.
  const semMetadados = resultados.filter((r) =>
    r.sinais.some((s) => s.chave === 'gps' && s.status === 'indisponivel'),
  ).length;

  let mensagem: string;
  if (reprovadas === 0 && revisao === 0) {
    mensagem = `Todas as ${total} fotos foram conferidas e publicadas na galeria.`;
  } else if (reprovadas === total) {
    const lista = [...campos.keys()].map((c) => rotulos[c] ?? c).join(' e ');
    if (lista) {
      mensagem = `Nenhuma foto foi publicada. A conferência automática indicou divergência em: ${lista}. Revise ${campos.size === 1 ? `o campo "${lista}"` : `os campos "${lista}"`} e reenvie — se os dados estiverem corretos, marque "solicitar revisão humana".`;
    } else if (semMetadados === total) {
      mensagem = `Nenhuma foto foi publicada porque os arquivos chegaram sem localização e data. Isso acontece quando as fotos são enviadas por WhatsApp ou por outro aplicativo que remove esses dados. Envie os arquivos originais da câmera ou do celular (pelo cabo, AirDrop ou "enviar como documento").`;
    } else {
      mensagem = `Nenhuma foto foi publicada. Veja abaixo o motivo de cada arquivo e reenvie após corrigir.`;
    }
  } else {
    const lista = [...campos.keys()].map((c) => rotulos[c] ?? c).join(', ');
    mensagem = `${aprovadas} de ${total} fotos foram publicadas. ${reprovadas > 0 ? `${reprovadas} foram devolvidas` : ''}${revisao > 0 ? `${reprovadas > 0 ? ' e ' : ''}${revisao} seguiram para conferência da coordenação` : ''}.${lista ? ` Verifique: ${lista}.` : ''}`;
  }

  const veredito: 'APROVADO_AUTOMATICO' | 'AGUARDANDO_REVISAO' | 'REPROVADO' =
    reprovadas === total ? 'REPROVADO' : revisao > 0 || reprovadas > 0 ? 'AGUARDANDO_REVISAO' : 'APROVADO_AUTOMATICO';

  return { total, aprovadas, revisao, reprovadas, score, mensagem, veredito, campos: [...campos.keys()] };
}
