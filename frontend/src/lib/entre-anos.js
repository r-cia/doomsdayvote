export const PALETA_CANDIDATOS = ['#ffb52e', '#7ec8ff', '#74e08c', '#ff6b57', '#c79bff', '#e6e6a0']
export const PALETA_DIFERENCAS = ['#ff7ac6', '#2ed3c4', '#f2efe4', '#c4e04a', '#d98c5f', '#8f9bff']
export const TRACOS_ANOS = [null, '8 4', '2 3', '10 3 2 3', '4 4', '1 3']
export const CORES_PADRAO = PALETA_CANDIDATOS
export const DOMINIO_X = Object.freeze({ min: 840, max: 1620 })

const LARGURA_CARACTERE = 6
const FOLGA_ROTULO = 14

export function dominioLog(valores) {
  const positivos = valores.filter((valor) => valor !== null && valor > 0)
  if (positivos.length === 0) return { min: 1, max: 10, marcas: [1, 10] }
  const inferior = Math.floor(Math.log10(Math.min(...positivos)))
  let superior = Math.ceil(Math.log10(Math.max(...positivos)))
  if (superior === inferior) superior += 1
  const marcas = []
  for (let expoente = inferior; expoente <= superior; expoente += 1) marcas.push(10 ** expoente)
  return { min: marcas[0], max: marcas.at(-1), marcas }
}

export function margemEsquerda(rotulos) {
  const largura = Math.max(0, ...rotulos.map((rotulo) => String(rotulo).length))
  return largura * LARGURA_CARACTERE + FOLGA_ROTULO
}

export function larguraRotulo(rotulo) {
  return String(rotulo).length * LARGURA_CARACTERE
}

export function margemDireita(rotuloUltimaMarca) {
  return Math.ceil(larguraRotulo(rotuloUltimaMarca) / 2) + 2
}

export function diferenca(pontosA, pontosB) {
  const porMinuto = new Map(pontosB.map((ponto) => [ponto.minuto, ponto.valor]))
  const resultado = []
  for (const ponto of pontosA) {
    const outro = porMinuto.get(ponto.minuto)
    if (outro === undefined || outro === null || ponto.valor === null) continue
    resultado.push({ minuto: ponto.minuto, valor: ponto.valor - outro })
  }
  return resultado
}

export function percentualDoTotal(pontos) {
  const total = pontos.reduce((soma, ponto) => soma + (ponto.valor ?? 0), 0)
  return pontos.map((ponto) => ({
    minuto: ponto.minuto,
    valor: ponto.valor === null || total === 0 ? null : (ponto.valor / total) * 100,
  }))
}

export function coresDosCandidatos(nomes) {
  const ordenados = [...new Set(nomes)].sort()
  return new Map(ordenados.map((nome, indice) => [nome, PALETA_CANDIDATOS[indice % PALETA_CANDIDATOS.length]]))
}

export function tracosDosAnos(anos) {
  const ordenados = [...new Set(anos)].sort((a, b) => a - b)
  return new Map(ordenados.map((ano, indice) => [ano, TRACOS_ANOS[indice % TRACOS_ANOS.length]]))
}

export function coresDosPares(anos) {
  const ordenados = [...new Set(anos)].sort((a, b) => a - b)
  const cores = new Map()
  for (let i = 0; i < ordenados.length; i += 1) {
    for (let j = i + 1; j < ordenados.length; j += 1) {
      cores.set(`${ordenados[i]}-${ordenados[j]}`, PALETA_DIFERENCAS[cores.size % PALETA_DIFERENCAS.length])
    }
  }
  return cores
}

export function diferencasEntrePares(series, cores = new Map()) {
  const diferencas = []
  for (let i = 0; i < series.length; i += 1) {
    for (let j = i + 1; j < series.length; j += 1) {
      diferencas.push({
        chave: `${series[i].chave}-${series[j].chave}`,
        rotulo: `${series[i].ano} − ${series[j].ano}`,
        cor: cores.get(`${series[i].ano}-${series[j].ano}`),
        pontos: diferenca(series[i].pontos, series[j].pontos),
      })
    }
  }
  return diferencas
}
