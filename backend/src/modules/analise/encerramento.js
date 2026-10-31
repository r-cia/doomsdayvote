import { sql } from 'kysely';
import { aplicarFiltroCorte } from '../apuracao/corte.js';
import { ordenarLista, ordenarSql } from '../../lib/ordenacao.js';

export const DERIVADAS_PARTIDO = {
  partido: (l) => l.partido,
  votos: (l) => l.votos,
  pct_votos: (l) => l.pct_votos,
};

const ENCERRAMENTO_BU = sql`coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts)`;

export function resumoPartidoVencedor(linhasPartidos, chaveDe) {
  const acumulados = new Map();
  for (const linha of linhasPartidos) {
    const chave = chaveDe(linha);
    if (!acumulados.has(chave)) {
      acumulados.set(chave, { total: 0, partidos: new Map() });
    }
    const acumulado = acumulados.get(chave);
    const votos = Number(linha.votos);
    acumulado.total += votos;
    acumulado.partidos.set(linha.sg_partido, (acumulado.partidos.get(linha.sg_partido) ?? 0) + votos);
  }
  const resumos = new Map();
  for (const [chave, acumulado] of acumulados) {
    let partido = null;
    let votosPartido = 0;
    for (const [nome, votos] of acumulado.partidos) {
      if (votos > votosPartido) {
        votosPartido = votos;
        partido = nome;
      }
    }
    resumos.set(chave, { partido, votos: votosPartido, total: acumulado.total });
  }
  return resumos;
}

export async function encerramentoPorUf(db, { eleicao, cargo, corte }) {
  const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;
  const corte1915 = `${eleicao.dt_pleito} 19:15:00-03`;

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicao.id)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  qb = aplicarFiltroCorte(qb, corte);

  const linhas = await qb
    .select([
      's.sg_uf',
      sql`count(*)::int`.as('total'),
      sql`count(*) filter (where ${ENCERRAMENTO_BU} <= ${corte1715}::timestamptz)::int`.as('ate_1715'),
      sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz and ${ENCERRAMENTO_BU} <= ${corte1915}::timestamptz)::int`.as('ate_1915'),
      sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1915}::timestamptz)::int`.as('apos_1915'),
    ])
    .groupBy('s.sg_uf')
    .orderBy('s.sg_uf')
    .execute();

  return linhas.map((l) => {
    const total = Number(l.total);
    const a1715 = Number(l.ate_1715);
    const a1915 = Number(l.ate_1915);
    const apos = Number(l.apos_1915);
    return {
      sg_uf: l.sg_uf,
      total,
      ate_1715: a1715,
      pct_1715: total > 0 ? (a1715 / total) * 100 : null,
      ate_1915: a1915,
      pct_1915: total > 0 ? (a1915 / total) * 100 : null,
      apos_1915: apos,
      pct_apos_1915: total > 0 ? (apos / total) * 100 : null,
    };
  });
}

export async function encerramentoPorMunicipio(db, { eleicao, cargo, corte, uf, ordenacao, limite }) {
  const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicao.id)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  qb = aplicarFiltroCorte(qb, corte);
  qb = qb.where('s.sg_uf', '=', uf);

  const aposExpr = sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz)`;
  const colunasSql = {
    nm_municipio: sql`max(l.nm_municipio)`,
    total: sql`count(*)`,
    apos_1715: aposExpr,
    pct_apos_1715: sql`(${aposExpr})::float / nullif(count(*),0)`,
  };
  const derivada = ordenacao.ordem in DERIVADAS_PARTIDO;
  const consultaMunicipios = ordenarSql(
    qb
      .select([
        's.cd_municipio_tse',
        sql`max(l.nm_municipio)`.as('nm_municipio'),
        sql`count(*)::int`.as('total'),
        sql`${aposExpr}::int`.as('apos_1715'),
      ])
      .groupBy(['s.cd_municipio_tse', 's.sg_uf']),
    colunasSql,
    derivada ? { ordem: 'pct_apos_1715', direcao: 'desc' } : ordenacao,
    ['s.cd_municipio_tse'],
  );
  const linhas = await (derivada ? consultaMunicipios : consultaMunicipios.limit(limite)).execute();

  let qbPartidos = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .where('bv.eleicao_id', '=', eleicao.id)
    .where('bv.cd_cargo_pergunta', '=', cargo)
    .where('s.sg_uf', '=', uf)
    .where('rv.categoria', 'in', ['nominal', 'legenda'])
    .where('rv.qt_votos', 'is not', null);
  qbPartidos = aplicarFiltroCorte(qbPartidos, corte);

  const linhasPartidos = await qbPartidos
    .select([
      's.cd_municipio_tse',
      'rv.sg_partido',
      sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('votos'),
    ])
    .groupBy(['s.cd_municipio_tse', 'rv.sg_partido'])
    .execute();

  const resumoPorMunicipio = resumoPartidoVencedor(linhasPartidos, (linha) => linha.cd_municipio_tse);

  const itens = linhas.map((l) => {
    const total = Number(l.total);
    const apos = Number(l.apos_1715);
    const resumo = resumoPorMunicipio.get(l.cd_municipio_tse) ?? {
      partido: null,
      votos: 0,
      total: 0,
    };
    return {
      cd_municipio_tse: l.cd_municipio_tse,
      nm_municipio: l.nm_municipio,
      total,
      apos_1715: apos,
      pct_apos_1715: total > 0 ? (apos / total) * 100 : null,
      partido: resumo.partido,
      votos: resumo.votos,
      pct_votos: resumo.total > 0 ? (resumo.votos / resumo.total) * 100 : null,
    };
  });
  return derivada ? ordenarLista(itens, DERIVADAS_PARTIDO, ordenacao).slice(0, limite) : itens;
}

export async function encerramentoPorSecao(db, { eleicao, cargo, corte, uf, municipio, ordenacao, limite }) {
  const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicao.id)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  qb = aplicarFiltroCorte(qb, corte);
  qb = qb.where('s.sg_uf', '=', uf).where('s.cd_municipio_tse', '=', municipio);

  const derivada = ordenacao !== null && ordenacao.ordem in DERIVADAS_PARTIDO;
  const consultaSecoes = qb.select([
    's.id',
    sql`bv.id`.as('bu_id'),
    's.nr_zona',
    's.nr_secao',
    ENCERRAMENTO_BU.as('dt_encerramento'),
    sql`case when ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz then true else false end`.as('apos_1715'),
  ]);
  const ordenada =
    ordenacao && !derivada
      ? ordenarSql(
          consultaSecoes,
          {
            nr_zona: sql.ref('s.nr_zona'),
            nr_secao: sql.ref('s.nr_secao'),
            dt_encerramento: ENCERRAMENTO_BU,
          },
          ordenacao,
          ['s.id'],
        )
      : consultaSecoes.orderBy(sql`(case when ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz then 1 else 0 end) desc, ${ENCERRAMENTO_BU} desc nulls last`);
  const linhas = await (derivada ? ordenada : ordenada.limit(limite)).execute();

  const ids = linhas.map((linha) => linha.bu_id).filter(Boolean);
  let resumoPorBu = new Map();
  if (ids.length > 0) {
    const linhasPartidos = await db
      .selectFrom('resultado_votavel as rv')
      .select([
        'rv.boletim_versao_id',
        'rv.sg_partido',
        sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('votos'),
      ])
      .where('rv.boletim_versao_id', 'in', ids)
      .where('rv.categoria', 'in', ['nominal', 'legenda'])
      .where('rv.qt_votos', 'is not', null)
      .groupBy(['rv.boletim_versao_id', 'rv.sg_partido'])
      .execute();

    resumoPorBu = resumoPartidoVencedor(linhasPartidos, (linha) => linha.boletim_versao_id);
  }

  const itens = linhas.map((l) => {
    const resumo = resumoPorBu.get(l.bu_id) ?? { partido: null, votos: 0, total: 0 };
    return {
      id: l.id,
      nr_zona: l.nr_zona,
      nr_secao: l.nr_secao,
      dt_encerramento: l.dt_encerramento,
      apos_1715: Boolean(l.apos_1715),
      partido: resumo.partido,
      votos: resumo.votos,
      pct_votos: resumo.total > 0 ? (resumo.votos / resumo.total) * 100 : null,
    };
  });
  return derivada ? ordenarLista(itens, DERIVADAS_PARTIDO, ordenacao).slice(0, limite) : itens;
}
