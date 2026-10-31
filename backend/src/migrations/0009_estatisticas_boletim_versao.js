import { sql } from 'kysely';

export async function up(db) {
  await sql`
    create statistics boletim_versao_filtro_stats (dependencies, ndistinct, mcv)
    on eleicao_id, cd_cargo_pergunta, ativo, cd_tipo_urna, (lower(ds_cargo_pergunta))
    from boletim_versao
  `.execute(db);
  await sql`analyze boletim_versao`.execute(db);
}

export async function down(db) {
  await sql`drop statistics if exists boletim_versao_filtro_stats`.execute(db);
}
