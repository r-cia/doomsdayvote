import { sql } from 'kysely';

export const FUSO_ORIGEM_BWEB = 'America/Sao_Paulo';

export function instanteOrigemSql(local) {
  if (!local) return null;
  return sql`(${local}::timestamp AT TIME ZONE ${FUSO_ORIGEM_BWEB})`;
}

export function dataOrigem(valor) {
  return valor?.data ?? null;
}

export function localOrigem(valor) {
  return valor?.local ?? null;
}
