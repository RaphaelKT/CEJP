import { prisma } from '@/lib/db';
import { ipHashDe, limitar, ok, respostaLimite, tratarErro } from '@/lib/api';
import { contactSchema } from '@/lib/validation';
import { moderarTexto } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const limite = limitar(`contato:${ipHashDe(req)}`, 5, 3_600_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const dados = contactSchema.parse(await req.json());
    const moderacao = moderarTexto(dados.message);

    await prisma.contactMessage.create({
      data: {
        name: dados.name,
        email: dados.email,
        phone: dados.phone || undefined,
        subject: dados.subject,
        message: moderacao.textoSanitizado,
      },
    });

    return ok({ recebido: true }, 201);
  } catch (e) {
    return tratarErro(e);
  }
}
