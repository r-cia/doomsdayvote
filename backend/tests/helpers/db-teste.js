import { sql } from 'kysely';

export async function limparBanco(db) {
  await sql`UPDATE boletim_versao SET substitui_versao_id = NULL`.execute(db);
  await sql`DELETE FROM resultado_votavel`.execute(db);
  await sql`DELETE FROM alerta_importacao`.execute(db);
  await sql`DELETE FROM boletim_versao`.execute(db);
  await sql`DELETE FROM lote_importacao`.execute(db);
  await sql`DELETE FROM secao_eleitoral`.execute(db);
  await sql`DELETE FROM localidade`.execute(db);
  await sql`DELETE FROM eleicao`.execute(db);
  await sql`DELETE FROM malha_geografica`.execute(db);
  await sql`DELETE FROM partido_cor`.execute(db);
}

export async function contar(db, tabela) {
  const { rows } = await sql`SELECT count(*)::int AS total FROM ${sql.table(tabela)}`.execute(db);
  return rows[0].total;
}
