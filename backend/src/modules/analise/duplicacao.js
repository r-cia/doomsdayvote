import { sql } from 'kysely'
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js'
import { ordenarLista } from '../../lib/ordenacao.js'
import { agruparPorSecao, linhasMvSecaoCandidato } from './mv-secao-candidato.js'

function chaveZona(secao) {
  return `${secao.sg_uf}|${secao.cd_municipio_tse}|${secao.nr_zona}`
}

function chaveMunicipio(secao) {
  return `${secao.sg_uf}|${secao.cd_municipio_tse}`
}

export const COLUNAS_DUPLICACAO = {
  secoes: (g) => g.secoes.length,
  sg_uf: (g) => g.secoes[0].sg_uf,
  nm_municipio: (g) => g.secoes[0].nm_municipio,
  nr_local_votacao: (g) => g.secoes[0].nr_local_votacao,
  votaveis: (g) => g.votaveis,
  candidato: (g) => g.vencedor_comum?.nm_votavel,
}

export function agruparAssinaturas(secoes = [], limite = 50, ordenacao = null) {
  const mapa = new Map()

  for (const secao of secoes) {
    if (!secao.assinatura) continue
    if (!mapa.has(secao.assinatura)) mapa.set(secao.assinatura, [])
    mapa.get(secao.assinatura).push(secao)
  }

  const grupos = []

  for (const [assinatura, lista] of mapa) {
    if (lista.length < 2) continue

    const zonas = new Set(lista.map(chaveZona))
    const municipios = new Set(lista.map(chaveMunicipio))
    const locais = lista
      .map((secao) => secao.nr_local_votacao)
      .filter((valor) => valor !== null && valor !== undefined)
    const mesmoLocal =
      locais.length === lista.length && new Set(locais).size === 1
    const ordenadas = [...lista].sort((a, b) => a.nr_secao - b.nr_secao)

    let consecutivas = false
    for (let i = 1; i < ordenadas.length; i += 1) {
      if (ordenadas[i].nr_secao - ordenadas[i - 1].nr_secao <= 1) {
        consecutivas = true
        break
      }
    }

    const vencedores = lista
      .map((secao) => secao.vencedor_nr)
      .filter((v) => v !== null && v !== undefined)
    const mesmoVencedorEmTodas =
      vencedores.length === lista.length &&
      vencedores.length > 0 &&
      vencedores.every((v) => Number(v) === Number(vencedores[0]))
    const vencedorComum = mesmoVencedorEmTodas && lista[0].vencedor_nr
      ? {
          nr_votavel: Number(lista[0].vencedor_nr),
          nm_votavel: lista[0].vencedor_nm,
          sg_partido: lista[0].vencedor_sg,
        }
      : null

    grupos.push({
      assinatura,
      votaveis: Number(lista[0].votaveis ?? 0),
      mesma_zona: zonas.size === 1,
      mesmo_municipio: municipios.size === 1,
      mesmo_local: mesmoLocal,
      secoes_consecutivas: consecutivas,
      vencedor_comum: vencedorComum,
      secoes: lista.map((secao) => ({
        id: secao.id,
        sg_uf: secao.sg_uf,
        cd_municipio_tse: secao.cd_municipio_tse,
        nm_municipio: secao.nm_municipio ?? null,
        nr_zona: secao.nr_zona,
        nr_secao: secao.nr_secao,
        nr_local_votacao: secao.nr_local_votacao ?? null,
        qt_aptos: secao.qt_aptos === null || secao.qt_aptos === undefined ? null : Number(secao.qt_aptos),
        qt_comparecimento: secao.qt_comparecimento === null || secao.qt_comparecimento === undefined ? null : Number(secao.qt_comparecimento),
      })),
    })
  }

  grupos.sort((a, b) => b.secoes.length - a.secoes.length)

  const totalSecoesGrupos = grupos.reduce((total, grupo) => total + grupo.secoes.length, 0)
  const limitados = ordenarLista(grupos, COLUNAS_DUPLICACAO, ordenacao).slice(0, limite)
  return {
    grupos: limitados,
    total_grupos: grupos.length,
    total_secoes: totalSecoesGrupos,
    total_secoes_escopo: secoes.length,
    cobertura: {
      consideradas: secoes.length,
      com_grupo: totalSecoesGrupos,
      sem_grupo: secoes.length - totalSecoesGrupos,
      grupos: grupos.length,
    },
  }
}

function agruparComVencedorDeZona(linhas, vencedorPorZona, limite, ordenacao) {
  const linhasAjustadas = linhas.map((linha) => {
    const chave = `${linha.sg_uf}|${linha.cd_municipio_tse}|${linha.nr_zona}`
    const vencedorZona = vencedorPorZona.get(chave)
    if (vencedorZona === null || vencedorZona === undefined || Number(linha.vencedor_nr) !== vencedorZona) {
      return { ...linha, vencedor_nr: null, vencedor_nm: null, vencedor_sg: null }
    }
    return linha
  })

  return agruparAssinaturas(
    linhasAjustadas.map((linha) => ({ ...linha, votaveis: Number(linha.votaveis) })),
    limite,
    ordenacao,
  )
}

function vencedorDaSecao(grupo) {
  const nominais = grupo.filter((linha) => linha.categoria === 'nominal')
  if (nominais.length === 0) return { nr_votavel: null, nm_votavel: null, sg_partido: null }
  return nominais.reduce((melhor, linha) => {
    if (!melhor) return linha
    const diferenca = Number(linha.votos) - Number(melhor.votos)
    return diferenca > 0 || (diferenca === 0 && Number(linha.nr_votavel) < Number(melhor.nr_votavel)) ? linha : melhor
  }, null)
}

async function duplicacaoPelaMv(db, { eleicaoId, cargo, escopo, limite, ordenacao }) {
  const linhasMv = await linhasMvSecaoCandidato(db, { eleicaoId, cargo, escopo })
  const linhas = [...agruparPorSecao(linhasMv).values()].map((grupo) => {
    const primeira = grupo[0]
    const vencedor = vencedorDaSecao(grupo)
    return {
      id: primeira.secao_id,
      sg_uf: primeira.sg_uf,
      cd_municipio_tse: primeira.cd_municipio_tse,
      nr_zona: primeira.nr_zona,
      nr_secao: primeira.nr_secao,
      nr_local_votacao: primeira.nr_local_votacao,
      nm_municipio: primeira.nm_municipio,
      qt_aptos: primeira.qt_aptos,
      qt_comparecimento: primeira.qt_comparecimento,
      vencedor_nr: vencedor.nr_votavel,
      vencedor_nm: vencedor.nm_votavel,
      vencedor_sg: vencedor.sg_partido,
      assinatura: primeira.assinatura,
      votaveis: primeira.votaveis,
    }
  })

  const vencedoresPorZona = new Map()
  for (const linha of linhas) {
    const chave = `${linha.sg_uf}|${linha.cd_municipio_tse}|${linha.nr_zona}`
    if (!vencedoresPorZona.has(chave)) vencedoresPorZona.set(chave, [])
    vencedoresPorZona.get(chave).push(linha.vencedor_nr)
  }
  const vencedorPorZona = new Map()
  for (const [chave, vencedores] of vencedoresPorZona) {
    const unico = Number(vencedores[0])
    vencedorPorZona.set(chave, vencedores.every((v) => v !== null && v !== undefined && Number(v) === unico) ? unico : null)
  }

  return agruparComVencedorDeZona(linhas, vencedorPorZona, limite, ordenacao)
}

export async function duplicacaoPorAssinatura(
  db,
  { eleicaoId, cargo, corte, escopo = {}, limite = 50, ordenacao = null },
) {
  if (corte.tipo === 'final') {
    return duplicacaoPelaMv(db, { eleicaoId, cargo, escopo, limite, ordenacao })
  }

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
      sql`(array_agg(rv.sg_partido ${ordemVencedor}) filter (where rv.categoria = 'nominal'))[1]`.as('vencedor_sg'),
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
