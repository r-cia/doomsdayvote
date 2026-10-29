import { sql } from 'kysely';

export async function up(db) {
  await sql`
    create unlogged table bweb_staging (
      lote_id uuid not null,
      chave text not null,
      nr_linha integer not null,
      valores jsonb not null
    )
  `.execute(db);

  await sql`
    create index bweb_staging_lote_chave_idx on bweb_staging (lote_id, chave)
  `.execute(db);
}

export async function down(db) {
  await sql`drop table if exists bweb_staging`.execute(db);
}
