import { erro, ok, tratarErro } from '@/lib/api';
import { rotateSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/** Rotaciona o refresh token e emite um novo access token. */
export async function POST() {
  try {
    const usuario = await rotateSession();
    if (!usuario) return erro('Sessão expirada. Entre novamente.', 401);
    return ok({ usuario: { publicId: usuario.publicId, fullName: usuario.fullName, roles: usuario.roles } });
  } catch (e) {
    return tratarErro(e);
  }
}
