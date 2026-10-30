import { sql } from 'kysely';

export async function up(db) {
  await sql`
    create materialized view mv_secao_candidato_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      bv.secao_id,
      rv.nr_votavel,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.sg_partido) as sg_partido,
      max(s.sg_uf) as sg_uf,
      max(s.cd_municipio_tse) as cd_municipio_tse,
      max(l.nm_municipio) as nm_municipio,
      max(s.nr_zona) as nr_zona,
      max(s.nr_secao) as nr_secao,
      max(bv.qt_aptos) as qt_aptos,
      max(bv.qt_comparecimento) as qt_comparecimento,
      max(bv.qt_abstencoes) as qt_abstencoes,
      max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
      max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts,
      sum(rv.qt_votos)::bigint as votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.categoria = 'nominal'
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.nr_votavel
    with no data
  `.execute(db);

  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);
}

export async function down(db) {
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);
}
