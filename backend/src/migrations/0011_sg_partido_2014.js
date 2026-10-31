import { sql } from 'kysely';

async function atualizarViews(db) {
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`refresh materialized view mv_metricas_final`.execute(db);
  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
}

export async function up(db) {
  await sql`
    update resultado_votavel
    set sg_partido = nm_partido
    where ano_eleicao = 2014 and sg_partido is null and nm_partido is not null
  `.execute(db);
  await atualizarViews(db);
}

export async function down(db) {
  await sql`
    update resultado_votavel
    set sg_partido = null
    where ano_eleicao = 2014 and sg_partido = nm_partido
  `.execute(db);
  await atualizarViews(db);
}
