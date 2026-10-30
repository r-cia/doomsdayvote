const CATEGORIAS_VALIDAS = new Set(['nominal', 'legenda'])

export function totalVotos(votos = []) {
  return votos.reduce((total, voto) => total + Number(voto.qt_votos ?? 0), 0)
}

export function votosValidos(votos = []) {
  return votos
    .filter((voto) => CATEGORIAS_VALIDAS.has(voto.categoria))
    .reduce((total, voto) => total + Number(voto.qt_votos ?? 0), 0)
}

export function nominaisNaOrdemDoServidor(votos = []) {
  return votos.filter((voto) => voto.categoria === 'nominal' && voto.nr_votavel !== null)
}

export function candidatosNominais(votos = []) {
  return nominaisNaOrdemDoServidor(votos)
    .slice()
    .sort((a, b) => Number(b.qt_votos) - Number(a.qt_votos))
}

export function mapaPartidos(votos = []) {
  const mapa = new Map()
  for (const voto of votos) {
    if (voto.nr_votavel === null || voto.nr_votavel === undefined) continue
    if (!mapa.has(voto.nr_votavel)) {
      mapa.set(voto.nr_votavel, {
        nr_votavel: voto.nr_votavel,
        nm_votavel: voto.nm_votavel,
        nr_partido: voto.nr_partido,
        sg_partido: voto.sg_partido,
        nm_partido: voto.nm_partido,
      })
    }
  }
  return mapa
}

export function resumoCandidato(votos = [], nrVotavel) {
  if (nrVotavel === null || nrVotavel === undefined) return null
  const candidato = votos.find(
    (voto) => voto.categoria === 'nominal' && voto.nr_votavel === nrVotavel,
  )
  if (!candidato) return null
  const validos = votosValidos(votos)
  return {
    ...candidato,
    qt_votos: Number(candidato.qt_votos ?? 0),
    percentual: validos > 0 ? (Number(candidato.qt_votos) / validos) * 100 : null,
  }
}

export function totaisCategoria(votos = []) {
  return votos.reduce(
    (totais, voto) => {
      const categoria = voto.categoria ?? 'outros'
      totais[categoria] = (totais[categoria] ?? 0) + Number(voto.qt_votos ?? 0)
      return totais
    },
    { nominal: 0, legenda: 0, branco: 0, nulo: 0, outros: 0 },
  )
}

export function chaveArea(area, nivel) {
  return nivel === 'uf' ? area.sg_uf : (area.geom_id ?? area.cd_municipio_tse)
}

export function normalizarCodigo(valor) {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .replace(/^0+/, '')
}

export function codigoMunicipioCurto(valor) {
  const codigo = normalizarCodigo(valor)
  return codigo.length > 5 ? codigo.slice(-5) : codigo
}

export function indexarAreas(areas = [], nivel) {
  const indice = new Map()
  for (const area of areas) {
    indice.set(normalizarCodigo(chaveArea(area, nivel)), area)
  }
  return indice
}

export function areaPorCodigo(indice, codigo, nivel) {
  const normalizado = normalizarCodigo(codigo)
  if (!normalizado) return null
  if (indice.has(normalizado)) return indice.get(normalizado)
  if (nivel === 'municipio') {
    return indice.get(codigoMunicipioCurto(normalizado)) ?? null
  }
  return null
}

export function percentualDaArea(area, modo, candidato) {
  if (!area) return null
  if (modo === 'percentual' && candidato) {
    return (
      area.candidatos?.find((item) => item.nr_votavel === candidato)?.percentual ??
      null
    )
  }
  return area.lider?.percentual ?? null
}

export function candidatoDaArea(area, candidato) {
  if (!area || candidato === null || candidato === undefined) return null
  return area.candidatos?.find((item) => item.nr_votavel === candidato) ?? null
}

export function linhasMapa(areas = [], nivel) {
  return areas
    .slice()
    .sort((a, b) => Number(b.total_votos) - Number(a.total_votos))
    .map((area) => ({
      chave: String(chaveArea(area, nivel)),
      area,
    }))
}
