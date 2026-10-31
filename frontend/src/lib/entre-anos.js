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

export function diferencasEntrePares(series) {
  const diferencas = []
  for (let i = 0; i < series.length; i += 1) {
    for (let j = i + 1; j < series.length; j += 1) {
      diferencas.push({
        chave: `${series[i].chave}-${series[j].chave}`,
        rotulo: `${series[i].ano} − ${series[j].ano}`,
        pontos: diferenca(series[i].pontos, series[j].pontos),
      })
    }
  }
  return diferencas
}
