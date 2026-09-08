import { prisma } from '@/lib/db';
import { erro, ipHashDe, limitar, ok, respostaLimite, tratarErro } from '@/lib/api';
import { loginSchema } from '@/lib/validation';
import { verifyPassword } from '@/lib/auth/crypto';
import { createSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const MAX_TENTATIVAS = 6;
const BLOQUEIO_MIN = 15;

export async function POST(req: Request) {
  try {
    const ipHash = ipHashDe(req);
    const limite = limitar(`entrar:${ipHash}`, 12, 900_000);
    if (!limite.permitido) return respostaLimite(limite.resetEm);

    const dados = loginSchema.parse(await req.json());
    const usuario = await prisma.user.findUnique({ where: { email: dados.email } });

    // Mensagem genérica: não revelamos se o e-mail existe (enumeração de contas).
    const generico = 'E-mail ou senha incorretos.';

    if (!usuario?.passwordHash) return erro(generico, 401);

    if (usuario.lockedUntil && usuario.lockedUntil > new Date()) {
      const minutos = Math.ceil((usuario.lockedUntil.getTime() - Date.now()) / 60_000);
      return erro(`Conta temporariamente bloqueada por segurança. Tente novamente em ${minutos} min.`, 423);
    }

    if (usuario.status === 'BANIDO' || usuario.status === 'SUSPENSO') {
      return erro('Sua conta está suspensa. Fale com a secretaria da igreja.', 403);
    }

    const senhaOk = await verifyPassword(dados.password, usuario.passwordHash);
    if (!senhaOk) {
      const tentativas = usuario.failedLogins + 1;
      await prisma.user.update({
        where: { id: usuario.id },
        data: {
          failedLogins: tentativas,
          lockedUntil: tentativas >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MIN * 60_000) : null,
        },
      });
      await prisma.auditLog.create({
        data: { actorId: usuario.id, action: 'user.login_failed', entityType: 'user', entityId: usuario.id, ipHash },
      });
      return erro(generico, 401);
    }

    await createSession(usuario.id, 'navegador');
    await prisma.auditLog.create({
      data: { actorId: usuario.id, action: 'user.login', entityType: 'user', entityId: usuario.id, ipHash },
    });

    return ok({
      usuario: { publicId: usuario.publicId, fullName: usuario.fullName, roles: usuario.roles },
    });
  } catch (e) {
    return tratarErro(e);
  }
}
