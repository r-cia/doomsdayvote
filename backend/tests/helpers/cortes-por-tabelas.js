import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../../src/modules/apuracao/corte.js';
import { concentracaoPura } from '../../src/modules/analise/concentracao.js';
import { agruparSecoes } from '../../src/modules/analise/comparacao-local.js';
import { agruparComVencedorDeZona } from '../../src/modules/analise/duplicacao.js';
import { linhasDeSecoesCompactas } from '../../src/modules/analise/mv-secao-candidato.js';
import { toNumberOrNull } from '../../src/modules/analise/estatistica-basica.js';

// Leituras antigas dos cortes parciais, direto de boletim_versao/resultado_votavel: referência das provas de equivalência com a view.

function base(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  return aplicarEscopo(aplicarFiltroCorte(qb, corte), escopo);
}

export async function concentracaoPelasTabelas(db, { eleicaoId, cargo, corte, escopo = {}, limite = 20, ordenacaoShare, ordenacaoMargem } = {}) {
  const corteEfetivo = corte;

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corteEfetivo);
  qb = aplicarEscopo(qb, escopo ?? {});

  const linhas = await qb
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.secao_id as secao_id',
      sql`max(s.sg_uf)`.as('sg_uf'),
      sql`max(s.cd_municipio_tse)`.as('cd_municipio_tse'),
      sql`max(s.nr_zona)`.as('nr_zona'),
      sql`max(s.nr_secao)`.as('nr_secao'),
      sql`max(s.nr_local_votacao)`.as('nr_local_votacao'),
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      sql`max(bv.qt_aptos)`.as('qt_aptos'),
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(coalesce(rv.sg_partido, rv.nm_partido))`.as('sg_partido'),
      'rv.categoria',
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.categoria', 'in', ['nominal', 'legenda'])
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'bv.secao_id',
      'rv.nr_votavel',
      'rv.categoria',
    ])
    .execute();

  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) {
      porSecao.set(linha.secao_id, {
        id: linha.secao_id,
        sg_uf: linha.sg_uf,
        cd_municipio_tse: linha.cd_municipio_tse,
        nm_municipio: linha.nm_municipio,
        nr_zona: linha.nr_zona,
        nr_secao: linha.nr_secao,
        nr_local_votacao: linha.nr_local_votacao,
        aptos: toNumberOrNull(linha.qt_aptos),
        validos: 0,
        candidatos: [],
      });
    }
    const secao = porSecao.get(linha.secao_id);
    const votos = toNumberOrNull(linha.votos);
    if (votos === null) continue;
    if (linha.categoria === 'nominal' || linha.categoria === 'legenda') {
      secao.validos += votos;
    }
    if (linha.categoria === 'nominal') {
      secao.candidatos.push({
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        qt_votos: votos,
      });
    }
  }

  const secoes = [...porSecao.values()].map((s) => ({
    id: s.id,
    sg_uf: s.sg_uf,
    cd_municipio_tse: s.cd_municipio_tse,
    nm_municipio: s.nm_municipio,
    nr_zona: s.nr_zona,
    nr_secao: s.nr_secao,
    nr_local_votacao: s.nr_local_votacao,
    qt_aptos: s.aptos,
    qt_votos_validos: s.validos,
    candidatos: s.candidatos,
  }));

  return concentracaoPura(secoes, { top: limite, ordenacaoShare, ordenacaoMargem });
}

export async function comparacaoLocalPelasTabelas(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const corteEfetivo = corte;

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corteEfetivo);
  qb = aplicarEscopo(qb, escopo ?? {});

  const linhas = await qb
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.secao_id as secao_id',
      sql`max(s.sg_uf)`.as('sg_uf'),
      sql`max(s.cd_municipio_tse)`.as('cd_municipio_tse'),
      sql`max(s.nr_zona)`.as('nr_zona'),
      sql`max(s.nr_secao)`.as('nr_secao'),
      sql`max(s.nr_local_votacao)`.as('nr_local_votacao'),
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      sql`max(bv.qt_aptos)`.as('qt_aptos'),
      sql`max(bv.qt_comparecimento)`.as('qt_comparecimento'),
      sql`max(bv.qt_abstencoes)`.as('qt_abstencoes'),
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(coalesce(rv.sg_partido, rv.nm_partido))`.as('sg_partido'),
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.categoria', '=', 'nominal')
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'bv.secao_id',
      'rv.nr_votavel',
    ])
    .execute();

  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) {
      porSecao.set(linha.secao_id, {
        id: linha.secao_id,
        sg_uf: linha.sg_uf,
        cd_municipio_tse: linha.cd_municipio_tse,
        nm_municipio: linha.nm_municipio,
        nr_zona: linha.nr_zona,
        nr_secao: linha.nr_secao,
        nr_local_votacao: linha.nr_local_votacao,
        qt_aptos: toNumberOrNull(linha.qt_aptos),
        qt_comparecimento: toNumberOrNull(linha.qt_comparecimento),
        qt_abstencoes: toNumberOrNull(linha.qt_abstencoes),
        candidatos: [],
      });
    }
    const secao = porSecao.get(linha.secao_id);
    secao.candidatos.push({
      nr_votavel: linha.nr_votavel,
      nm_votavel: linha.nm_votavel,
      sg_partido: linha.sg_partido,
      qt_votos: toNumberOrNull(linha.votos),
    });
  }

  const secoes = [...porSecao.values()];
  return agruparSecoes(secoes, { minimoGrupo: 5 });
}

export async function duplicacaoPelasTabelas(db, { eleicaoId, cargo, corte, escopo = {}, limite = 50, ordenacao = null }) {
  let consulta = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo)

  consulta = aplicarFiltroCorte(consulta, corte)
  consulta = aplicarEscopo(consulta, escopo)

  const ordemVencedor = sql`order by rv.qt_votos desc, rv.nr_votavel asc`
  const linhas = await consulta
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.secao_id as id',
      sql`max(s.sg_uf)`.as('sg_uf'),
      sql`max(s.cd_municipio_tse)`.as('cd_municipio_tse'),
      sql`max(s.nr_zona)`.as('nr_zona'),
      sql`max(s.nr_secao)`.as('nr_secao'),
      sql`max(s.nr_local_votacao)`.as('nr_local_votacao'),
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      sql`max(bv.qt_aptos)`.as('qt_aptos'),
      sql`max(bv.qt_comparecimento)`.as('qt_comparecimento'),
      sql`(array_agg(rv.nr_votavel ${ordemVencedor}) filter (where rv.categoria = 'nominal'))[1]`.as('vencedor_nr'),
      sql`(array_agg(rv.nm_votavel ${ordemVencedor}) filter (where rv.categoria = 'nominal'))[1]`.as('vencedor_nm'),
      sql`(array_agg(coalesce(rv.sg_partido, rv.nm_partido) ${ordemVencedor}) filter (where rv.categoria = 'nominal'))[1]`.as('vencedor_sg'),
      sql`md5(string_agg(rv.cd_tipo_votavel::text || ':' || rv.nr_votavel::text || ':' || coalesce(rv.qt_votos, 0)::text, '|' order by rv.cd_tipo_votavel, rv.nr_votavel))`.as(
        'assinatura',
      ),
      sql`count(*)`.as('votaveis'),
    ])
    .where('rv.qt_votos', 'is not', null)
    .groupBy('bv.secao_id')
    .execute()

  // Garante que o vencedor só é exibido se ele venceu em TODAS as seções
  // de TODAS as zonas envolvidas (não apenas nas seções duplicadas).
  const zonasUnicas = [
    ...new Set(linhas.map((linha) => `${linha.sg_uf}|${linha.cd_municipio_tse}|${linha.nr_zona}`)),
  ]
  const vencedorPorZona = new Map()
  if (zonasUnicas.length > 0) {
    let consultaZonas = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .leftJoin('localidade as l', (join) =>
        join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .where('bv.eleicao_id', '=', eleicaoId)
      .where('bv.cd_cargo_pergunta', '=', cargo)
    consultaZonas = aplicarFiltroCorte(consultaZonas, corte)
    consultaZonas = aplicarEscopo(consultaZonas, escopo)
    consultaZonas = consultaZonas
      .leftJoin('resultado_votavel as rv', (join) =>
        join
          .onRef('rv.boletim_versao_id', '=', 'bv.id')
          .on('rv.categoria', '=', 'nominal')
          .on('rv.qt_votos', 'is not', null),
      )
      .select([
        sql`max(s.sg_uf)`.as('sg_uf'),
        sql`max(s.cd_municipio_tse)`.as('cd_municipio_tse'),
        sql`max(s.nr_zona)`.as('nr_zona'),
        sql`(array_agg(rv.nr_votavel order by rv.qt_votos desc, rv.nr_votavel asc) filter (where rv.nr_votavel is not null))[1]`.as(
          'vencedor_nr',
        ),
      ])
      .groupBy('bv.id')

    const linhasZonas = await consultaZonas.execute()
    const porZona = new Map()
    for (const linha of linhasZonas) {
      const chave = `${linha.sg_uf}|${linha.cd_municipio_tse}|${linha.nr_zona}`
      if (!porZona.has(chave)) porZona.set(chave, [])
      porZona.get(chave).push(linha.vencedor_nr)
    }
    for (const [chave, vencedores] of porZona) {
      const validos = vencedores.filter((v) => v !== null && v !== undefined)
      if (validos.length === vencedores.length && validos.length > 0 && validos.every((v) => Number(v) === Number(validos[0]))) {
        vencedorPorZona.set(chave, Number(validos[0]))
      } else {
        vencedorPorZona.set(chave, null)
      }
    }
  }

  return agruparComVencedorDeZona(linhas, vencedorPorZona, limite, ordenacao)
}

export async function baseSecaoCandidatoPelasTabelas(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const porVotavel = base(db, { eleicaoId, cargo, corte, escopo })
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .select([
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(coalesce(rv.sg_partido, rv.nm_partido))`.as('sg_partido'),
      'bv.secao_id',
      sql`max(s.sg_uf)`.as('sg_uf'),
      sql`max(s.cd_municipio_tse)`.as('cd_municipio_tse'),
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      sql`max(s.nr_zona)`.as('nr_zona'),
      sql`max(s.nr_secao)`.as('nr_secao'),
      sql`max(bv.qt_aptos)`.as('qt_aptos'),
      sql`max(bv.qt_comparecimento)`.as('qt_comparecimento'),
      sql`max(bv.qt_abstencoes)`.as('qt_abstencoes'),
      sql`max(bv.qt_elei_biom_sem_habilitacao)`.as('qt_biom'),
      sql`max(bv.dt_bu_recebido_ts)`.as('dt_bu_recebido_ts'),
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.categoria', '=', 'nominal')
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'rv.nr_votavel',
      'bv.secao_id',
    ])

  // Uma linha por seção, com os votos em arrays (mesmo formato de `secoesCompactas`).
  const { rows } = await sql`
    with por_votavel as (${porVotavel}),
    dic as (
      select nm_votavel, sg_partido, (row_number() over (order by nm_votavel nulls first, sg_partido nulls first) - 1)::int as ref
      from (select distinct nm_votavel, sg_partido from por_votavel) distintos
    )
    select
      p.secao_id,
      max(p.sg_uf) as sg_uf,
      max(p.cd_municipio_tse) as cd_municipio_tse,
      max(p.nm_municipio) as nm_municipio,
      max(p.nr_zona) as nr_zona,
      max(p.nr_secao) as nr_secao,
      max(p.qt_aptos) as qt_aptos,
      max(p.qt_comparecimento) as qt_comparecimento,
      max(p.qt_abstencoes) as qt_abstencoes,
      max(p.qt_biom) as qt_biom,
      max(p.dt_bu_recebido_ts) as dt_bu_recebido_ts,
      array_agg(p.nr_votavel order by p.nr_votavel)::int[] as nrs,
      array_agg(p.votos order by p.nr_votavel)::int[] as votos,
      array_agg(d.ref order by p.nr_votavel)::int[] as refs,
      null::jsonb as dicionario
    from por_votavel p
    join dic d on p.nm_votavel is not distinct from d.nm_votavel and p.sg_partido is not distinct from d.sg_partido
    group by p.secao_id
    union all
    select
      null, null, null, null, null, null, null, null, null, null, null, null, null, null,
      (select jsonb_agg(jsonb_build_object('nm_votavel', nm_votavel, 'sg_partido', sg_partido) order by ref) from dic)
    order by secao_id nulls last
  `.execute(db)

  const secoes = rows.filter((linha) => linha.secao_id !== null)
  const votaveis = rows.find((linha) => linha.secao_id === null)?.dicionario ?? []
  return linhasDeSecoesCompactas({ secoes, votaveis })
}

export function candidatosPelasTabelas(db, recorte, eleicao) {
  return base(db, recorte)
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(coalesce(rv.sg_partido, rv.nm_partido))`.as('sg_partido'),
      sql`count(*)::int`.as('secoes'),
      sql`count(*) filter (where rv.qt_votos > 0)::int`.as('secoes_com_voto'),
      sql`avg(rv.qt_votos)`.as('media'),
      sql`percentile_cont(0.5) within group (order by rv.qt_votos)`.as('mediana'),
      sql`stddev_pop(rv.qt_votos)`.as('desvio'),
    ])
    .where('rv.ano_eleicao', '=', eleicao.ano_eleicao)
    .where('rv.nr_turno', '=', eleicao.nr_turno)
    .where('rv.cd_cargo_pergunta', '=', recorte.cargo)
    .where('rv.categoria', '=', 'nominal')
    .where('rv.qt_votos', 'is not', null)
    .groupBy('rv.nr_votavel')
    .orderBy(sql`avg(rv.qt_votos) desc`)
    .execute();
}
