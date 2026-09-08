import 'server-only';
import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { Role } from '@prisma/client';
import { prisma, safeQuery } from '@/lib/db';
import { env } from '@/lib/env';
import { anonymizeIp, randomToken, sha256 } from './crypto';
import { permissionsFor, type Permission } from './rbac';

const ACCESS_COOKIE = 'meb_at';
const REFRESH_COOKIE = 'meb_rt';
const secretKey = new TextEncoder().encode(env.AUTH_SECRET);

export type SessionUser = {
  id: string;
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: Role[];
  membershipStage: string;
  sessionId: string;
};

type AccessClaims = JWTPayload & {
  sub: string;
  sid: string;
  email: string;
  name: string;
  roles: Role[];
  stage: string;
  avatar?: string | null;
  pid: string;
};

/* ------------------------------------------------------------------ */
/*  Emissão                                                            */
/* ------------------------------------------------------------------ */

async function signAccessToken(claims: Omit<AccessClaims, 'iat' | 'exp'>) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('meb.auth')
    .setAudience('meb.web')
    .setExpirationTime(`${env.AUTH_ACCESS_TTL_MIN}m`)
    .sign(secretKey);
}

/**
 * Cria uma sessão persistida (refresh rotativo) e grava os dois cookies.
 * O access token é curto (20 min) e o refresh vive no banco, podendo ser
 * revogado individualmente — "sair de todos os dispositivos".
 */
export async function createSession(userId: string, deviceLabel?: string) {
  const hdrs = await headers();
  const refreshToken = randomToken(48);
  const expiresAt = new Date(Date.now() + env.AUTH_REFRESH_TTL_DAYS * 86_400_000);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      publicId: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      roles: true,
      membershipStage: true,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: sha256(refreshToken),
      userAgent: hdrs.get('user-agent')?.slice(0, 300) ?? null,
      ipHash: anonymizeIp(hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip')),
      deviceLabel: deviceLabel ?? null,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    pid: user.publicId,
    sid: session.id,
    email: user.email,
    name: user.fullName,
    roles: user.roles,
    stage: user.membershipStage,
    avatar: user.avatarUrl,
  });

  const jar = await cookies();
  const base = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  jar.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: env.AUTH_ACCESS_TTL_MIN * 60 });
  jar.set(REFRESH_COOKIE, `${session.id}.${refreshToken}`, {
    ...base,
    maxAge: env.AUTH_REFRESH_TTL_DAYS * 86_400,
  });

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date(), failedLogins: 0 } });

  return session;
}

/* ------------------------------------------------------------------ */
/*  Leitura                                                            */
/* ------------------------------------------------------------------ */

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;

  if (access) {
    try {
      const { payload } = await jwtVerify<AccessClaims>(access, secretKey, {
        issuer: 'meb.auth',
        audience: 'meb.web',
      });
      return {
        id: payload.sub,
        publicId: payload.pid,
        email: payload.email,
        fullName: payload.name,
        avatarUrl: payload.avatar ?? null,
        roles: payload.roles,
        membershipStage: payload.stage,
        sessionId: payload.sid,
      };
    } catch {
      /* token expirado — tenta o refresh abaixo */
    }
  }

  return refreshFromCookie();
}

/**
 * Renova a sessão a partir do refresh persistido.
 * Observação: Server Components não podem escrever cookies; por isso a
 * renovação efetiva (rotação) acontece na rota `/api/auth/refresh`, e aqui
 * apenas devolvemos a identidade para renderizar a página.
 */
async function refreshFromCookie(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(REFRESH_COOKIE)?.value;
  if (!raw) return null;
  const [sessionId, token] = raw.split('.');
  if (!sessionId || !token) return null;

  return safeQuery(async () => {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            roles: true,
            membershipStage: true,
            status: true,
          },
        },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.refreshTokenHash !== sha256(token) ||
      session.user.status === 'BANIDO' ||
      session.user.status === 'SUSPENSO'
    ) {
      return null;
    }
    return {
      id: session.user.id,
      publicId: session.user.publicId,
      email: session.user.email,
      fullName: session.user.fullName,
      avatarUrl: session.user.avatarUrl,
      roles: session.user.roles,
      membershipStage: session.user.membershipStage,
      sessionId: session.id,
    } satisfies SessionUser;
  }, null);
}

/** Rotaciona o refresh token (chamado por /api/auth/refresh). */
export async function rotateSession(): Promise<SessionUser | null> {
  const user = await refreshFromCookie();
  if (!user) return null;
  await prisma.session.update({
    where: { id: user.sessionId },
    data: { revokedAt: new Date(), revokedReason: 'rotacao' },
  });
  await createSession(user.id);
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(REFRESH_COOKIE)?.value;
  if (raw) {
    const [sessionId] = raw.split('.');
    if (sessionId) {
      await safeQuery(
        () =>
          prisma.session.updateMany({
            where: { id: sessionId, revokedAt: null },
            data: { revokedAt: new Date(), revokedReason: 'logout' },
          }),
        { count: 0 },
      );
    }
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: 'revogacao_global' },
  });
}

/* ------------------------------------------------------------------ */
/*  Guardas                                                            */
/* ------------------------------------------------------------------ */

export class AuthorizationError extends Error {
  constructor(message = 'Acesso não autorizado.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError('É necessário entrar na sua conta.');
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!permissionsFor(user.roles).has(permission)) {
    throw new AuthorizationError('Você não tem permissão para esta ação.');
  }
  return user;
}

export async function hasPermission(permission: Permission) {
  const user = await getSessionUser();
  return user ? permissionsFor(user.roles).has(permission) : false;
}
