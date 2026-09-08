import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Camada de armazenamento com interface única.
 * O adaptador local grava em `public/uploads`; em produção troca-se por
 * S3/R2 implementando `salvar` — nenhum chamador precisa mudar.
 */
export type ArquivoSalvo = { storageKey: string; url: string };

export interface StorageAdapter {
  salvar(buffer: Buffer, nome: string, mime: string): Promise<ArquivoSalvo>;
}

class LocalStorage implements StorageAdapter {
  async salvar(buffer: Buffer, nome: string, _mime: string): Promise<ArquivoSalvo> {
    const ext = path.extname(nome).toLowerCase() || '.jpg';
    const pasta = new Date().toISOString().slice(0, 7); // 2026-09
    const key = `${pasta}/${randomUUID()}${ext}`;
    const destino = path.join(process.cwd(), 'public', 'uploads', key);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, buffer);
    return { storageKey: key, url: `/uploads/${key}` };
  }
}

let adapter: StorageAdapter | null = null;

export function storage(): StorageAdapter {
  adapter ??= new LocalStorage();
  return adapter;
}

export const MIMES_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic'];

export function validarArquivo(file: { size: number; type: string; name: string }) {
  const maxBytes = env.MEDIA_MAX_MB * 1024 * 1024;
  if (file.size > maxBytes) return `"${file.name}" tem ${(file.size / 1048576).toFixed(1)} MB — o limite é ${env.MEDIA_MAX_MB} MB.`;
  if (!MIMES_ACEITOS.includes(file.type)) return `"${file.name}" está em um formato não aceito (${file.type || 'desconhecido'}). Envie JPG, PNG, WebP ou HEIC.`;
  return null;
}
