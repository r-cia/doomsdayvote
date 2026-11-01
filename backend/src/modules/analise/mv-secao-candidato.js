import { sql } from 'kysely';

export function linhasMvSecaoCandidato(db, { eleicaoId, cargo, escopo = {}, categorias = null }) {
  let consulta = db
    .selectFrom('mv_secao_candidato_final')
    .selectAll()
    .where('eleicao_id', '=', eleicaoId)
    .where('cargo', '=', cargo);
  if (categorias) consulta = consulta.where('categoria', 'in', categorias);
  if (escopo.sgUf) consulta = consulta.where('sg_uf', '=', escopo.sgUf);
  if (escopo.cdMunicipio) consulta = consulta.where('cd_municipio_tse', '=', escopo.cdMunicipio);
  if (escopo.nrZona) consulta = consulta.where('nr_zona', '=', escopo.nrZona);
  if (escopo.secaoId) consulta = consulta.where('secao_id', '=', escopo.secaoId);
  return consulta.execute();
}

export function agruparPorSecao(linhas) {
  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) porSecao.set(linha.secao_id, []);
    porSecao.get(linha.secao_id).push(linha);
  }
  return porSecao;
}

export const CATEGORIAS_MV = [
  'nominal',
  'legenda',
  'branco',
  'nulo',
  'anulado_apurado_separado',
  'anulado',
  'outro',
];

const CODIGO_CATEGORIA = sql`case m.categoria
  when 'nominal' then 0 when 'legenda' then 1 when 'branco' then 2 when 'nulo' then 3
  when 'anulado_apurado_separado' then 4 when 'anulado' then 5 else 6 end`;

// Uma linha por seção, com os votos em arrays paralelos ordenados por (cd_tipo_votavel, nr_votavel). Nomes e partidos
// vêm de um dicionário pequeno (`votaveis`, indexado por `refs`), para não repetir texto em cada seção × votável.
export async function secoesCompactas(db, { eleicaoId, cargo, escopo = {}, categorias = null }) {
  const filtros = [sql`m.eleicao_id = ${eleicaoId}`, sql`m.cargo = ${cargo}`];
  if (categorias) filtros.push(sql`m.categoria in (${sql.join(categorias)})`);
  if (escopo.sgUf) filtros.push(sql`m.sg_uf = ${escopo.sgUf}`);
  if (escopo.cdMunicipio) filtros.push(sql`m.cd_municipio_tse = ${escopo.cdMunicipio}`);
  if (escopo.nrZona) filtros.push(sql`m.nr_zona = ${escopo.nrZona}`);
  if (escopo.secaoId) filtros.push(sql`m.secao_id = ${escopo.secaoId}`);
  const onde = sql.join(filtros, sql` and `);
  const ordem = sql`order by m.cd_tipo_votavel, m.nr_votavel`;

  const { rows } = await sql`
    with dic as (
      select nm_votavel, sg_partido, (row_number() over (order by nm_votavel nulls first, sg_partido nulls first) - 1)::int as ref
      from (select distinct m.nm_votavel, m.sg_partido from mv_secao_candidato_final m where ${onde}) distintos
    )
    select
      m.secao_id,
      max(m.sg_uf) as sg_uf,
      max(m.cd_municipio_tse) as cd_municipio_tse,
      max(m.nm_municipio) as nm_municipio,
      max(m.nr_zona) as nr_zona,
      max(m.nr_secao) as nr_secao,
      max(m.nr_local_votacao) as nr_local_votacao,
      max(m.qt_aptos) as qt_aptos,
      max(m.qt_comparecimento) as qt_comparecimento,
      max(m.qt_abstencoes) as qt_abstencoes,
      max(m.qt_biom) as qt_biom,
      max(m.dt_bu_recebido_ts) as dt_bu_recebido_ts,
      max(m.validos) as validos,
      max(m.assinatura) as assinatura,
      max(m.votaveis) as votaveis,
      array_agg(m.nr_votavel ${ordem})::int[] as nrs,
      array_agg(m.cd_tipo_votavel ${ordem})::int[] as tipos,
      array_agg(${CODIGO_CATEGORIA} ${ordem})::int[] as cats,
      array_agg(m.votos ${ordem})::int[] as votos,
      array_agg(d.ref ${ordem})::int[] as refs
    from mv_secao_candidato_final m
    join dic d on m.nm_votavel is not distinct from d.nm_votavel and m.sg_partido is not distinct from d.sg_partido
    where ${onde}
    group by m.secao_id
    order by m.secao_id
  `.execute(db);

  const { rows: dicionario } = await sql`
    select nm_votavel, sg_partido
    from (select distinct m.nm_votavel, m.sg_partido from mv_secao_candidato_final m where ${onde}) distintos
    order by nm_votavel nulls first, sg_partido nulls first
  `.execute(db);

  return { secoes: rows, votaveis: dicionario };
}

export function expandirSecao(secao, votaveis) {
  return secao.nrs.map((nr, i) => ({
    secao_id: secao.secao_id,
    sg_uf: secao.sg_uf,
    cd_municipio_tse: secao.cd_municipio_tse,
    nm_municipio: secao.nm_municipio,
    nr_zona: secao.nr_zona,
    nr_secao: secao.nr_secao,
    nr_local_votacao: secao.nr_local_votacao,
    qt_aptos: secao.qt_aptos,
    qt_comparecimento: secao.qt_comparecimento,
    qt_abstencoes: secao.qt_abstencoes,
    qt_biom: secao.qt_biom,
    dt_bu_recebido_ts: secao.dt_bu_recebido_ts,
    validos: secao.validos,
    assinatura: secao.assinatura,
    votaveis: secao.votaveis,
    nr_votavel: nr,
    cd_tipo_votavel: secao.tipos ? secao.tipos[i] : 1,
    categoria: secao.cats ? CATEGORIAS_MV[secao.cats[i]] : 'nominal',
    nm_votavel: votaveis[secao.refs[i]].nm_votavel,
    sg_partido: votaveis[secao.refs[i]].sg_partido,
    votos: secao.votos[i],
  }));
}

// Iterável de linhas (seção × votável) montadas uma a uma a partir das seções compactas: nada é materializado.
export function linhasDeSecoesCompactas({ secoes, votaveis }) {
  return {
    *[Symbol.iterator]() {
      for (const secao of secoes) yield* expandirSecao(secao, votaveis);
    },
  };
}
