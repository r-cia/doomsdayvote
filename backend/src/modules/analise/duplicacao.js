import { sql } from 'kysely'
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js'

function chaveZona(secao) {
  return `${secao.sg_uf}|${secao.cd_municipio_tse}|${secao.nr_zona}`
}

function chaveMunicipio(secao) {
  return `${secao.sg_uf}|${secao.cd_municipio_tse}`
}

export function agruparAssinaturas(secoes = [], limite = 50) {
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
    const ordenadas = [...lista].sort((a, b) => a.nr_secao - b.nr_secao)

    let consecutivas = false
    for (let i = 1; i < ordenadas.length; i += 1) {
      if (ordenadas[i].nr_secao - ordenadas[i - 1].nr_secao <= 1) {
        consecutivas = true
        break
      }
    }

    grupos.push({
      assinatura,
      votaveis: Number(lista[0].votaveis ?? 0),
      mesma_zona: zonas.size === 1,
      mesmo_municipio: municipios.size === 1,
      secoes_consecutivas: consecutivas,
      secoes: lista.map((secao) => ({
        id: secao.id,
        sg_uf: secao.sg_uf,
        cd_municipio_tse: secao.cd_municipio_tse,
        nr_zona: secao.nr_zona,
        nr_secao: secao.nr_secao,
      })),
    })
  }

  grupos.sort((a, b) => b.secoes.length - a.secoes.length)

  const limitados = grupos.slice(0, limite)
  return {
    grupos: limitados,
    total_grupos: grupos.length,
    total_secoes: grupos.reduce((total, grupo) => total + grupo.secoes.length, 0),
  }
}

export async function duplicacaoPorAssinatura(
  db,
  { eleicaoId, cargo, corte, escopo = {}, limite = 50 },
) {
  let consulta = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo)

  consulta = aplicarFiltroCorte(consulta, corte)
  consulta = aplicarEscopo(consulta, escopo)

  const linhas = await consulta
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.secao_id as id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      sql`md5(string_agg(rv.cd_tipo_votavel::text || ':' || rv.nr_votavel::text || ':' || coalesce(rv.qt_votos, 0)::text, '|' order by rv.cd_tipo_votavel, rv.nr_votavel))`.as(
        'assinatura',
      ),
      sql`count(*)`.as('votaveis'),
    ])
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'bv.secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
    ])
    .execute()

  return agruparAssinaturas(
    linhas.map((linha) => ({ ...linha, votaveis: Number(linha.votaveis) })),
    limite,
  )
}
