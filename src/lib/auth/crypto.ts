import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '@/lib/env';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain + env.HASH_PEPPER, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain + env.HASH_PEPPER, hash);
}

/** Hash determinístico com pepper — usado para CPF, IP e fingerprints (LGPD). */
export function peppered(value: string) {
  return createHash('sha256').update(`${env.HASH_PEPPER}:${value}`).digest('hex');
}

export function sha256(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

/** Comparação em tempo constante para tokens/assinaturas. */
export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Anonimiza IP antes de persistir (mantém utilidade antifraude, remove PII). */
export function anonymizeIp(ip: string | null | undefined) {
  if (!ip) return null;
  return peppered(ip.split(',')[0]!.trim());
}
