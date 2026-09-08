import { prisma } from '@/lib/db';
import { erro, ipHashDe, limitar, ok, respostaLimite, tratarErro } from '@/lib/api';
import { registerSchema } from '@/lib/validation';
import { hashPassword, peppered, randomToken, sha256 } from '@/lib/auth/crypto';
import { createSession } from '@/lib/auth/session';
import { recalcularContadores } from '@/lib/stats';

export const dynamic = 'force-dynamic';

/**
 * Cadastro de novo usuário.
 *
 * Toda pessoa entra como VISITANTE. A promoção a MEMBRO é responsabilidade
 * exclusiva do motor de frequência (5 presenças confirmadas na janela) —
 * ninguém se autodeclara membro.
 */
export async function POST(req: Request) {
  try {
    const limite = limitar(`registrar:${ipHashDe(req)}`, 5, 3_600_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const dados = registerSchema.parse(await req.json());

    const jaExiste = await prisma.user.findUnique({ where: { email: dados.email }, select: { id: true } });
    if (jaExiste) {
      return erro('Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.', 409, {
        campos: { email: 'E-mail já cadastrado.' },
      });
    }

    const igrejaSede = dados.homeChurchSlug
      ? await prisma.church.findUnique({ where: { slug: dados.homeChurchSlug }, select: { id: true } })
      : await prisma.church.findFirst({ where: { status: 'SEDE' }, select: { id: true } });

    const usuario = await prisma.user.create({
      data: {
        email: dados.email,
        fullName: dados.fullName.trim(),
        phone: dados.phone || undefined,
        birthDate: dados.birthDate ? new Date(dados.birthDate) : undefined,
        passwordHash: await hashPassword(dados.password),
        status: 'ATIVO', // verificação por e-mail acontece em paralelo
        roles: ['VISITANTE'],
        membershipStage: 'VISITANTE',
        homeChurchId: igrejaSede?.id,
        marketingOptIn: dados.marketingOptIn ?? false,
        privacyPolicyVersion: '2026.1',
        privacyAcceptedAt: new Date(),
        consents: {
          create: {
            kind: 'privacidade',
            version: '2026.1',
            granted: true,
            ipHash: ipHashDe(req),
          },
        },
      },
      select: { id: true, publicId: true, fullName: true, email: true },
    });

    // Token de verificação de e-mail (o envio fica a cargo do serviço de e-mail).
    const token = randomToken(24);
    await prisma.verificationToken.create({
      data: {
        userId: usuario.id,
        identifier: usuario.email,
        tokenHash: sha256(token),
        purpose: 'VERIFICACAO_EMAIL',
        expiresAt: new Date(Date.now() + 48 * 3_600_000),
      },
    });

    await prisma.auditLog.create({
      data: { actorId: usuario.id, action: 'user.registered', entityType: 'user', entityId: usuario.id, ipHash: ipHashDe(req) },
    });

    await createSession(usuario.id, 'navegador');
    await recalcularContadores(['membros']);

    return ok({ usuario: { publicId: usuario.publicId, fullName: usuario.fullName } }, 201);
  } catch (e) {
    return tratarErro(e);
  }
}
