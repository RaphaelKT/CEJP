import { z } from 'zod';
import { erro, ok, tratarErro } from '@/lib/api';
import { requirePermission } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/rbac';
import { confirmarMembresia } from '@/lib/membership/engine';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  aprovar: z.boolean(),
  nota: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  try {
    const ator = await requirePermission(PERMISSIONS.MEMBRESIA_APROVAR);
    const dados = schema.parse(await req.json());
    await confirmarMembresia(dados.userId, ator.id, dados.aprovar, dados.nota);
    return ok({ aprovado: dados.aprovar });
  } catch (e) {
    if (e instanceof Error && e.message.includes('aguardando confirmação')) {
      return erro(e.message, 409);
    }
    return tratarErro(e);
  }
}
