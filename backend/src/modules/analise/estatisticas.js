import { sql } from 'kysely'
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js'
import { calcularBenford } from './benford.js'

export const MINIMO_VOTOS_BENFORD = 10

function base(db, { eleicaoId, cargo, corte, escopo = {} }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo)

  qb = aplicarFiltroCorte(qb, corte)
  return aplicarEscopo(qb, escopo)
}

export async function composicaoBiometria(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const linha = await base(db, { eleicaoId, cargo, corte, escopo })
    .select([
      sql`coalesce(sum(bv.qt_aptos), 0)`.as('qt_aptos'),
      sql`coalesce(sum(bv.qt_comparecimento), 0)`.as('qt_comparecimento'),
      sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao), 0)`.as('qt_nao_habilitada'),
      sql`count(*)`.as('secoes'),
      sql`count(*) filter (where bv.qt_elei_biom_sem_habilitacao is null)`.as('secoes_sem_campo'),
    ])
    .executeTakeFirstOrThrow()

  const comparecimento = Number(linha.qt_comparecimento)
  const naoHabilitada = Number(linha.qt_nao_habilitada)
  const habilitada = Math.max(0, comparecimento - naoHabilitada)
  const aptos = Number(linha.qt_aptos)

  return {
    secoes: Number(linha.secoes),
    secoes_sem_campo: Number(linha.secoes_sem_campo),
    qt_aptos: aptos,
    qt_comparecimento: comparecimento,
    qt_habilitados_por_biometria: habilitada,
    qt_biometria_nao_habilitada: naoHabilitada,
    percentual_comparecimento: aptos > 0 ? (comparecimento / aptos) * 100 : null,
    percentual_habilitada:
      comparecimento > 0 ? (habilitada / comparecimento) * 100 : null,
    percentual_nao_habilitada:
      comparecimento > 0 ? (naoHabilitada / comparecimento) * 100 : null,
  }
}

export async function baseSecaoCandidato(
  db,
  { eleicaoId, cargo, corte, escopo = {} },
) {
  return base(db, { eleicaoId, cargo, corte, escopo })
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .select([
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(rv.sg_partido)`.as('sg_partido'),
      'bv.secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      's.nr_zona',
      's.nr_secao',
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
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
    ])
    .execute()
}

export function benfordDosNiveis(linhas, minimoVotos = MINIMO_VOTOS_BENFORD) {
  const porCandidato = new Map()

  for (const linha of linhas) {
    const votos = Number(linha.votos)
    if (!porCandidato.has(linha.nr_votavel)) {
      porCandidato.set(linha.nr_votavel, {
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        total_votos: 0,
        secoes: [],
        zonas: new Map(),
        municipios: new Map(),
      })
    }

    const candidato = porCandidato.get(linha.nr_votavel)
    candidato.total_votos += votos
    candidato.secoes.push(votos)

    const chaveZona = `${linha.sg_uf}|${linha.cd_municipio_tse}|${linha.nr_zona}`
    candidato.zonas.set(chaveZona, (candidato.zonas.get(chaveZona) ?? 0) + votos)

    const chaveMunicipio = `${linha.sg_uf}|${linha.cd_municipio_tse}`
    candidato.municipios.set(
      chaveMunicipio,
      (candidato.municipios.get(chaveMunicipio) ?? 0) + votos,
    )
  }

  const candidatos = [...porCandidato.values()]
    .map((candidato) => {
      const secoes = candidato.secoes.filter((votos) => votos >= minimoVotos)
      const zonas = [...candidato.zonas.values()].filter(
        (votos) => votos >= minimoVotos,
      )
      const municipios = [...candidato.municipios.values()].filter(
        (votos) => votos >= minimoVotos,
      )

      return {
        nr_votavel: candidato.nr_votavel,
        nm_votavel: candidato.nm_votavel,
        sg_partido: candidato.sg_partido,
        total_votos: candidato.total_votos,
        secoes_abaixo_minimo: candidato.secoes.length - secoes.length,
        niveis: {
          secao: calcularBenford(secoes),
          zona: calcularBenford(zonas),
          municipio: calcularBenford(municipios),
        },
      }
    })
    .sort((a, b) => b.total_votos - a.total_votos)

  return { minimo_votos: minimoVotos, candidatos }
}

export async function benfordPorCandidato(db, escopo) {
  return benfordDosNiveis(await baseSecaoCandidato(db, escopo))
}

export function featuresDasSecoes(linhas) {
  const porSecao = new Map()

  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) {
      porSecao.set(linha.secao_id, {
        id: linha.secao_id,
        sg_uf: linha.sg_uf,
        cd_municipio_tse: linha.cd_municipio_tse,
        nm_municipio: linha.nm_municipio ?? null,
        nr_zona: linha.nr_zona,
        nr_secao: linha.nr_secao,
        aptos: Number(linha.qt_aptos ?? 0),
        comparecimento: Number(linha.qt_comparecimento ?? 0),
        abstencoes: Number(linha.qt_abstencoes ?? 0),
        biometria: Number(linha.qt_biom ?? 0),
        recebido: linha.dt_bu_recebido_ts
          ? new Date(linha.dt_bu_recebido_ts).getTime()
          : null,
        votos: [],
      })
    }
    porSecao.get(linha.secao_id).votos.push(Number(linha.votos))
  }

  const secoes = [...porSecao.values()].filter(
    (secao) => secao.aptos > 0 && secao.comparecimento > 0 && secao.votos.length > 0,
  )

  let primeiro = Infinity
  let ultimo = -Infinity
  for (const secao of secoes) {
    if (Number.isFinite(secao.recebido)) {
      if (secao.recebido < primeiro) primeiro = secao.recebido
      if (secao.recebido > ultimo) ultimo = secao.recebido
    }
  }
  const intervalo = ultimo - primeiro

  return secoes.map((secao) => {
    const total = secao.votos.reduce((soma, votos) => soma + votos, 0)
    const maior = Math.max(...secao.votos)
    const concentracao =
      total > 0
        ? secao.votos.reduce((soma, votos) => soma + (votos / total) ** 2, 0)
        : 0

    return {
      id: secao.id,
      sg_uf: secao.sg_uf,
      cd_municipio_tse: secao.cd_municipio_tse,
      nm_municipio: secao.nm_municipio ?? null,
      nr_zona: secao.nr_zona,
      nr_secao: secao.nr_secao,
      participacao: secao.comparecimento / secao.aptos,
      abstencao: secao.abstencoes / secao.aptos,
      biometria: secao.biometria / secao.comparecimento,
      hora:
        Number.isFinite(secao.recebido) && intervalo > 0
          ? (secao.recebido - primeiro) / intervalo
          : 0.5,
      tamanho: Math.log10(secao.aptos + 1),
      share_lider: total > 0 ? maior / total : 0,
      concentracao,
    }
  })
}
