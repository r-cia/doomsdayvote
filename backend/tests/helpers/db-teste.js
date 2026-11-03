import pg from 'pg';
import { sql } from 'kysely';
import { atualizarViewsMaterializadas } from '../../src/db/views.js';

function nomeDoBanco(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

const URL_TESTE = process.env.TEST_DATABASE_URL;
const URL_PROD = process.env.DATABASE_URL;
if (!URL_TESTE) throw new Error('TEST_DATABASE_URL não definida');
if (URL_TESTE === URL_PROD || (URL_PROD && nomeDoBanco(URL_TESTE) === nomeDoBanco(URL_PROD))) {
  throw new Error('TEST_DATABASE_URL não pode apontar para o banco de produção');
}

// REFRESH MATERIALIZED VIEW exige o dono da view; o papel da aplicação não tem essa permissão.
export async function atualizarViews() {
  const cliente = new pg.Client({ connectionString: process.env.TEST_DATABASE_MIGRATION_URL });
  await cliente.connect();
  try {
    await atualizarViewsMaterializadas((texto) => cliente.query(texto));
  } finally {
    await cliente.end();
  }
}

export async function limparBanco(db) {
  await sql`DELETE FROM bweb_staging`.execute(db);
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
