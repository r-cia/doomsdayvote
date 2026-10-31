import { sql } from 'kysely';

export async function up(db) {
  await sql`drop materialized view if exists mv_totais_area cascade`.execute(db);

  await sql`
    create materialized view if not exists mv_totais_area as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      s.sg_uf,
      s.cd_municipio_tse,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      max(l.geom_id) as geom_id,
      max(l.nm_municipio) as nm_municipio,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, s.sg_uf, s.cd_municipio_tse, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_totais_area_pk on mv_totais_area (eleicao_id, cargo, sg_uf, cd_municipio_tse, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_totais_area_eleicao_idx on mv_totais_area (eleicao_id, cargo, sg_uf)`.execute(db);

  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`ANALYZE mv_totais_area`.execute(db);
}

export async function down(db) {
  await sql`drop materialized view if exists mv_totais_area cascade`.execute(db);
}