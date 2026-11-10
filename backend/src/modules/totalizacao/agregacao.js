import { sql } from 'kysely';

const FILTROS_OPCIONAIS = Object.freeze([
  ['loteId', 'lote_id'],
  ['sgUf', 'sg_uf'],
  ['cdMunicipioTse', 'cd_municipio_tse'],
  ['nrZona', 'nr_zona'],
  ['nrSecao', 'nr_secao'],
]);

function filtroDoRecorte(recorte, alias, lotes) {
  const condicoes = [
    sql`${sql.ref(`${alias}.ano_eleicao`)} = ${recorte.anoEleicao}`,
    sql`${sql.ref(`${alias}.nr_turno`)} = ${recorte.nrTurno}`,
    filtroLotes(lotes, alias),
  ];

  for (const [chave, coluna] of FILTROS_OPCIONAIS) {
    const valor = recorte[chave];
    if (valor !== undefined && valor !== null) {
      condicoes.push(sql`${sql.ref(`${alias}.${coluna}`)} = ${valor}`);
    }
  }

  return sql.join(condicoes, sql` and `);
}

const STATUS_VIGENTES = ['concluido', 'parcial'];

export async function lotesVigentes(db, recorte) {
  let consulta = db
    .selectFrom('totalizacao_lote as l')
    .select('l.id')
    .where('l.status', 'in', STATUS_VIGENTES)
    .where('l.ano_eleicao', '=', recorte.anoEleicao)
    .where('l.nr_turno', '=', recorte.nrTurno);

  if (recorte.sgUf) consulta = consulta.where('l.sg_uf', '=', recorte.sgUf);

  if (recorte.loteId !== undefined && recorte.loteId !== null) {
    consulta = consulta.where('l.id', '=', recorte.loteId);
  } else {
    consulta = consulta.where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom('totalizacao_lote as n')
            .select('n.id')
            .whereRef('n.sg_uf', '=', 'l.sg_uf')
            .whereRef('n.ano_eleicao', '=', 'l.ano_eleicao')
            .whereRef('n.nr_turno', '=', 'l.nr_turno')
            .where('n.status', 'in', STATUS_VIGENTES)
            .whereRef('n.iniciado_em', '>', 'l.iniciado_em'),
        ),
      ),
    );
  }

  return (await consulta.execute()).map((lote) => lote.id);
}

export function filtroLotes(lotes, alias) {
  if (lotes.length === 0) return sql`false`;
  return sql`${sql.ref(`${alias}.lote_id`)} in (${sql.join(lotes)})`;
}

export async function agregarMetricas(db, recorte) {
  if (recorte?.anoEleicao === undefined || recorte?.nrTurno === undefined) {
    throw new Error('recorte exige anoEleicao e nrTurno');
  }

  const lotes = await lotesVigentes(db, recorte);

  const [tempoBiometria, incidentes, complementares] = await Promise.all([
    sql`
      select
        count(e.duracao_ms)::int as quantidade,
        avg(e.duracao_ms)::float8 as media_ms,
        percentile_cont(0.5) within group (order by e.duracao_ms) as mediana_ms,
        min(e.duracao_ms)::int as mais_rapido_ms,
        max(e.duracao_ms)::int as mais_demora_ms,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 1))::int as falhou_1,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 2))::int as falhou_2,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 3))::int as falhou_3,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria >= 4))::int as falhou_4,
        (count(*) filter (where e.tp_habilitacao = 3))::int as manual
      from totalizacao_eleitor e
      join totalizacao_secao s on s.id = e.totalizacao_secao_id
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
    sql`
      select count(*)::int as total
      from totalizacao_incidente i
      join totalizacao_secao s on s.id = i.totalizacao_secao_id
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
    sql`
      select
        count(distinct (s.sg_uf, s.cd_municipio_tse, s.nr_zona, s.nr_secao))::int as secoes,
        coalesce(sum(s.qt_aptos), 0)::bigint as aptos,
        coalesce(sum(s.qt_comparecimento), 0)::bigint as comparecimento,
        coalesce(sum(eleitor.teclas_indevidas), 0)::bigint as teclas_indevidas,
        coalesce(sum(eleitor.correcoes), 0)::bigint as correcoes
      from totalizacao_secao s
      left join lateral (
        select
          sum(e.qt_teclas_indevidas) as teclas_indevidas,
          count(*) filter (where e.correcao) as correcoes
        from totalizacao_eleitor e
        where e.totalizacao_secao_id = s.id
      ) eleitor on true
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
  ]);

  const tempo = tempoBiometria.rows[0];

  const totais = complementares.rows[0];

  return {
    tempo: {
      quantidade: Number(tempo.quantidade),
      mediaMs: tempo.media_ms === null ? null : Number(tempo.media_ms),
      medianaMs: tempo.mediana_ms === null ? null : Number(tempo.mediana_ms),
      maisRapidoMs: tempo.mais_rapido_ms === null ? null : Number(tempo.mais_rapido_ms),
      maisDemoradoMs: tempo.mais_demora_ms === null ? null : Number(tempo.mais_demora_ms),
    },
    biometria: {
      falhou1: Number(tempo.falhou_1),
      falhou2: Number(tempo.falhou_2),
      falhou3: Number(tempo.falhou_3),
      falhou4: Number(tempo.falhou_4),
      manual: Number(tempo.manual),
    },
    incidentes: {
      total: Number(incidentes.rows[0].total),
    },
    complementares: {
      secoes: Number(totais.secoes),
      aptos: Number(totais.aptos),
      comparecimento: Number(totais.comparecimento),
      teclasIndevidas: Number(totais.teclas_indevidas),
      correcoes: Number(totais.correcoes),
    },
  };
}
