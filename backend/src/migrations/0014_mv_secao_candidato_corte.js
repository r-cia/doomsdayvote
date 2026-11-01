import { sql } from 'kysely';

function definicao(nome, comCorte) {
  const camposCorte = comCorte
    ? sql`,
        max(bv.precisao_dt_bu_recebido) as precisao_dt_bu_recebido,
        max(bv.dt_bu_recebido_data) as dt_bu_recebido_data`
    : sql``;
  return sql`
    create materialized view ${sql.table(nome)} as
    with linhas as (
      select
        bv.eleicao_id,
        bv.cd_cargo_pergunta as cargo,
        bv.secao_id,
        rv.nr_votavel,
        rv.cd_tipo_votavel,
        rv.categoria,
        max(rv.nm_votavel) as nm_votavel,
        max(coalesce(rv.sg_partido, rv.nm_partido)) as sg_partido,
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
        max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts${camposCorte},
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
  `;
}

// A construção roda sobre uma view nova, então as leituras da antiga continuam; só a troca final pede o lock exclusivo.
async function trocar(db, comCorte) {
  await definicao('mv_secao_candidato_final_nova', comCorte).execute(db);
  await sql`create unique index mv_secao_candidato_final_nova_pk on mv_secao_candidato_final_nova (eleicao_id, cargo, secao_id, cd_tipo_votavel, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_nova_area_idx on mv_secao_candidato_final_nova (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  if (comCorte) {
    await sql`create index mv_secao_candidato_final_nova_recebimento_idx on mv_secao_candidato_final_nova (eleicao_id, cargo, dt_bu_recebido_ts)`.execute(db);
  }
  await sql`analyze mv_secao_candidato_final_nova`.execute(db);

  await sql`drop materialized view mv_secao_candidato_final`.execute(db);
  await sql`alter materialized view mv_secao_candidato_final_nova rename to mv_secao_candidato_final`.execute(db);
  await sql`alter index mv_secao_candidato_final_nova_pk rename to mv_secao_candidato_final_pk`.execute(db);
  await sql`alter index mv_secao_candidato_final_nova_area_idx rename to mv_secao_candidato_final_area_idx`.execute(db);
  if (comCorte) {
    await sql`alter index mv_secao_candidato_final_nova_recebimento_idx rename to mv_secao_candidato_final_recebimento_idx`.execute(db);
  }
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);
}

export async function up(db) {
  await trocar(db, true);
}

export async function down(db) {
  await trocar(db, false);
}
