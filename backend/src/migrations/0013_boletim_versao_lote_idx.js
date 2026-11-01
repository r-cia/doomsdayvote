import { sql } from 'kysely';

export async function up(db) {
  // CREATE INDEX comum: dentro da transação da migration, o lock SHARE ainda permite leituras da API.
  await sql`
    create index boletim_versao_lote_eleicao_cargo_idx
    on boletim_versao (lote_id, eleicao_id, cd_cargo_pergunta, dt_bu_recebido_ts)
    where ativo and cd_tipo_urna = 1
  `.execute(db);
  await sql`analyze boletim_versao`.execute(db);
}

export async function down(db) {
  await sql`drop index if exists boletim_versao_lote_eleicao_cargo_idx`.execute(db);
}
