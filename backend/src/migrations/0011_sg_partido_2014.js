import { sql } from 'kysely';

const SIGLA_COM_FALLBACK = 'coalesce(rv.sg_partido, rv.nm_partido)';
const SIGLA_ORIGINAL = 'rv.sg_partido';

async function recriarVotosFinal(db, sigla) {
  await sql`drop materialized view if exists mv_votos_final`.execute(db);
  await sql`
    create materialized view mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(${sql.raw(sigla)}) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) <= (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_ate_1715,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_tardios
    from boletim_versao bv
    join eleicao e on e.id = bv.eleicao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);
  await sql`create unique index mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`analyze mv_votos_final`.execute(db);
  await sql`grant select on mv_votos_final to doomsday_app`.execute(db);
}

async function recriarTotaisArea(db, sigla) {
  await sql`drop materialized view if exists mv_totais_area`.execute(db);
  await sql`
    create materialized view mv_totais_area as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      s.sg_uf,
      s.cd_municipio_tse,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(${sql.raw(sigla)}) as sg_partido,
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
  await sql`create unique index mv_totais_area_pk on mv_totais_area (eleicao_id, cargo, sg_uf, cd_municipio_tse, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index mv_totais_area_eleicao_idx on mv_totais_area (eleicao_id, cargo, sg_uf)`.execute(db);
  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`analyze mv_totais_area`.execute(db);
  await sql`grant select on mv_totais_area to doomsday_app`.execute(db);
}

async function recriarSecaoCandidatoFinal(db, sigla) {
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);
  await sql`
    create materialized view mv_secao_candidato_final as
    with linhas as (
      select
        bv.eleicao_id,
        bv.cd_cargo_pergunta as cargo,
        bv.secao_id,
        rv.nr_votavel,
        rv.cd_tipo_votavel,
        rv.categoria,
        max(rv.nm_votavel) as nm_votavel,
        max(${sql.raw(sigla)}) as sg_partido,
        max(s.sg_uf) as sg_uf,
        max(s.cd_municipio_tse) as cd_municipio_tse,
        max(l.nm_municipio) as nm_municipio,
        max(s.nr_zona) as nr_zona,
        max(s.nr_secao) as nr_secao,
        max(s.nr_local_votacao) as nr_local_votacao,
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
        and rv.qt_votos is not null
      group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    )
    select
      linhas.*,
      (sum(votos) filter (where categoria in ('nominal', 'legenda')) over secao)::bigint as validos,
      md5(string_agg(cd_tipo_votavel::text || ':' || nr_votavel::text || ':' || votos::text, '|')
        over (secao order by cd_tipo_votavel, nr_votavel rows between unbounded preceding and unbounded following)) as assinatura,
      count(*) over secao as votaveis
    from linhas
    window secao as (partition by eleicao_id, cargo, secao_id)
    with no data
  `.execute(db);
  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, cd_tipo_votavel, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);
}

async function recriarViews(db, sigla) {
  await recriarVotosFinal(db, sigla);
  await recriarTotaisArea(db, sigla);
  await recriarSecaoCandidatoFinal(db, sigla);
}

export async function up(db) {
  await recriarViews(db, SIGLA_COM_FALLBACK);
}

export async function down(db) {
  await recriarViews(db, SIGLA_ORIGINAL);
}
