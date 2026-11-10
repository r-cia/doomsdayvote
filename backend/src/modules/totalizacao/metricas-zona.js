import { sql } from 'kysely';

export async function recalcularMetricasDoLote(db, loteId) {
  await sql`delete from totalizacao_zona_duracao where lote_id = ${loteId}`.execute(db);
  await sql`delete from totalizacao_zona_metrica where lote_id = ${loteId}`.execute(db);

  await sql`
    insert into totalizacao_zona_metrica (
      lote_id, cd_municipio_tse, nr_zona, qt_secoes, qt_aptos, qt_comparecimento,
      qt_duracao, soma_duracao_ms, min_duracao_ms, max_duracao_ms,
      falhou_1, falhou_2, falhou_3, falhou_4, manual, teclas_indevidas, correcoes, qt_incidentes
    )
    with sec as (
      select cd_municipio_tse, nr_zona, count(*)::int as qt_secoes,
        coalesce(sum(qt_aptos), 0)::bigint as qt_aptos,
        coalesce(sum(qt_comparecimento), 0)::bigint as qt_comparecimento
      from totalizacao_secao
      where lote_id = ${loteId}
      group by cd_municipio_tse, nr_zona
    ),
    ele as (
      select s.cd_municipio_tse, s.nr_zona,
        count(e.duracao_ms)::bigint as qt_duracao,
        coalesce(sum(e.duracao_ms), 0)::bigint as soma_duracao_ms,
        min(e.duracao_ms)::int as min_duracao_ms,
        max(e.duracao_ms)::int as max_duracao_ms,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 1))::int as falhou_1,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 2))::int as falhou_2,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 3))::int as falhou_3,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria >= 4))::int as falhou_4,
        (count(*) filter (where e.tp_habilitacao = 3))::int as manual,
        coalesce(sum(e.qt_teclas_indevidas), 0)::bigint as teclas_indevidas,
        (count(*) filter (where e.correcao))::int as correcoes
      from totalizacao_eleitor e
      join totalizacao_secao s on s.id = e.totalizacao_secao_id
      where s.lote_id = ${loteId}
      group by s.cd_municipio_tse, s.nr_zona
    ),
    inc as (
      select s.cd_municipio_tse, s.nr_zona, count(*)::int as qt_incidentes
      from totalizacao_incidente i
      join totalizacao_secao s on s.id = i.totalizacao_secao_id
      where s.lote_id = ${loteId}
      group by s.cd_municipio_tse, s.nr_zona
    )
    select ${loteId}::uuid, sec.cd_municipio_tse, sec.nr_zona, sec.qt_secoes, sec.qt_aptos, sec.qt_comparecimento,
      coalesce(ele.qt_duracao, 0), coalesce(ele.soma_duracao_ms, 0), ele.min_duracao_ms, ele.max_duracao_ms,
      coalesce(ele.falhou_1, 0), coalesce(ele.falhou_2, 0), coalesce(ele.falhou_3, 0), coalesce(ele.falhou_4, 0),
      coalesce(ele.manual, 0), coalesce(ele.teclas_indevidas, 0), coalesce(ele.correcoes, 0),
      coalesce(inc.qt_incidentes, 0)
    from sec
    left join ele using (cd_municipio_tse, nr_zona)
    left join inc using (cd_municipio_tse, nr_zona)
  `.execute(db);

  await sql`
    insert into totalizacao_zona_duracao (lote_id, cd_municipio_tse, nr_zona, segundo, qt, soma_ms)
    select ${loteId}::uuid, s.cd_municipio_tse, s.nr_zona, (e.duracao_ms / 1000)::int,
      count(*)::int, sum(e.duracao_ms)::bigint
    from totalizacao_eleitor e
    join totalizacao_secao s on s.id = e.totalizacao_secao_id
    where s.lote_id = ${loteId} and e.duracao_ms is not null
    group by s.cd_municipio_tse, s.nr_zona, (e.duracao_ms / 1000)::int
  `.execute(db);
}
