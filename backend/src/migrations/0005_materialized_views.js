import { sql } from 'kysely';

export async function up(db) {
  // MV: agregados de votos por candidato no corte final
  await sql`
    create materialized view if not exists mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);

  // MV: metricas de comparecimento por recorte (final)
  await sql`
    create materialized view if not exists mv_metricas_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      coalesce(sum(bv.qt_aptos), 0)::bigint as qt_aptos,
      coalesce(sum(bv.qt_comparecimento), 0)::bigint as qt_comparecimento,
      coalesce(sum(bv.qt_abstencoes), 0)::bigint as qt_abstencoes,
      count(*)::int as bus_considerados
    from boletim_versao bv
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
    group by bv.eleicao_id, bv.cd_cargo_pergunta
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_metricas_final_pk on mv_metricas_final (eleicao_id, cargo)`.execute(db);

  // Popula
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`refresh materialized view mv_metricas_final`.execute(db);

  await sql`ANALYZE mv_votos_final, mv_metricas_final`.execute(db);
}

export async function down(db) {
  await sql`drop materialized view if exists mv_metricas_final cascade`.execute(db);
  await sql`drop materialized view if exists mv_votos_final cascade`.execute(db);
}