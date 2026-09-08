import type { Role } from '@prisma/client';

/**
 * Controle de acesso baseado em papéis.
 * Cada permissão é uma string "dominio:acao" e cada papel carrega um conjunto.
 */
export const PERMISSIONS = {
  MURAL_MODERAR: 'mural:moderar',
  MIDIA_ENVIAR: 'midia:enviar',
  MIDIA_REVISAR: 'midia:revisar',
  PRESENCA_REGISTRAR: 'presenca:registrar',
  MEMBRESIA_APROVAR: 'membresia:aprovar',
  FINANCEIRO_LER: 'financeiro:ler',
  FINANCEIRO_ESTORNAR: 'financeiro:estornar',
  EVENTOS_GERIR: 'eventos:gerir',
  CONTEUDO_GERIR: 'conteudo:gerir',
  USUARIOS_GERIR: 'usuarios:gerir',
  PAINEL_ACESSAR: 'painel:acessar',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const MATRIX: Record<Role, Permission[]> = {
  VISITANTE: [],
  MEMBRO: [],
  LIDER: [PERMISSIONS.PAINEL_ACESSAR, PERMISSIONS.PRESENCA_REGISTRAR, PERMISSIONS.MURAL_MODERAR],
  MIDIA: [PERMISSIONS.PAINEL_ACESSAR, PERMISSIONS.MIDIA_ENVIAR],
  TESOURARIA: [PERMISSIONS.PAINEL_ACESSAR, PERMISSIONS.FINANCEIRO_LER, PERMISSIONS.FINANCEIRO_ESTORNAR],
  SECRETARIA: [
    PERMISSIONS.PAINEL_ACESSAR,
    PERMISSIONS.PRESENCA_REGISTRAR,
    PERMISSIONS.MEMBRESIA_APROVAR,
    PERMISSIONS.USUARIOS_GERIR,
    PERMISSIONS.EVENTOS_GERIR,
  ],
  PASTOR: [
    PERMISSIONS.PAINEL_ACESSAR,
    PERMISSIONS.MEMBRESIA_APROVAR,
    PERMISSIONS.MURAL_MODERAR,
    PERMISSIONS.MIDIA_REVISAR,
    PERMISSIONS.FINANCEIRO_LER,
    PERMISSIONS.CONTEUDO_GERIR,
    PERMISSIONS.EVENTOS_GERIR,
  ],
  ADMIN: Object.values(PERMISSIONS),
};

export function permissionsFor(roles: Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) for (const p of MATRIX[role] ?? []) set.add(p);
  return set;
}

export function can(roles: Role[], permission: Permission) {
  return permissionsFor(roles).has(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  VISITANTE: 'Visitante',
  MEMBRO: 'Membro',
  LIDER: 'Liderança',
  MIDIA: 'Equipe de Mídia',
  TESOURARIA: 'Tesouraria',
  SECRETARIA: 'Secretaria',
  PASTOR: 'Pastoral',
  ADMIN: 'Administração',
};
