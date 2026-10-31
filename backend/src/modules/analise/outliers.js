import { mediana } from './estatistica-basica.js'

export const FEATURES = Object.freeze([
  'participacao',
  'biometria',
  'hora',
  'tamanho',
  'share_lider',
  'concentracao',
])

function mulberry32(semente) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function caminhoEsperado(n) {
  if (n <= 1) return 0
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n
}

function amostrar(total, quantidade, rng) {
  const indices = Array.from({ length: total }, (_, indice) => indice)
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, quantidade)
}

function construirArvore(pontos, profundidade, limite, rng) {
  const tamanho = pontos.length
  if (profundidade >= limite || tamanho <= 1) return { folha: true, tamanho }

  const eixos = pontos[0].length
  const eixo = Math.floor(rng() * eixos)
  let minimo = Infinity
  let maximo = -Infinity
  for (const ponto of pontos) {
    if (ponto[eixo] < minimo) minimo = ponto[eixo]
    if (ponto[eixo] > maximo) maximo = ponto[eixo]
  }
  if (minimo === maximo) return { folha: true, tamanho }

  const corte = minimo + rng() * (maximo - minimo)
  const esquerda = []
  const direita = []
  for (const ponto of pontos) {
    if (ponto[eixo] < corte) esquerda.push(ponto)
    else direita.push(ponto)
  }
  if (esquerda.length === 0 || direita.length === 0) {
    return { folha: true, tamanho }
  }

  return {
    folha: false,
    tamanho,
    eixo,
    corte,
    esquerda: construirArvore(esquerda, profundidade + 1, limite, rng),
    direita: construirArvore(direita, profundidade + 1, limite, rng),
  }
}

function comprimento(no, ponto, profundidade = 0) {
  if (no.folha) return profundidade + caminhoEsperado(no.tamanho)
  return ponto[no.eixo] < no.corte
    ? comprimento(no.esquerda, ponto, profundidade + 1)
    : comprimento(no.direita, ponto, profundidade + 1)
}

export function isolationForest(dados, { arvores = 100, amostra = 256, semente = 42 } = {}) {
  const total = dados.length
  if (total === 0) return { scores: [], arvores, amostra, limiar: 0.6 }
  if (total === 1) return { scores: [0.5], arvores, amostra, limiar: 0.6 }

  const rng = mulberry32(semente)
  const tamanhoAmostra = Math.min(amostra, total)
  const limite = Math.ceil(Math.log2(Math.max(2, tamanhoAmostra)))
  const floresta = []

  for (let i = 0; i < arvores; i += 1) {
    const indices = amostrar(total, tamanhoAmostra, rng)
    floresta.push(
      construirArvore(indices.map((indice) => dados[indice]), 0, limite, rng),
    )
  }

  const normalizador = caminhoEsperado(tamanhoAmostra)
  const scores = dados.map((ponto) => {
    let soma = 0
    for (const arvore of floresta) soma += comprimento(arvore, ponto)
    const media = soma / floresta.length
    const score = normalizador > 0 ? 2 ** (-media / normalizador) : 0.5
    return Math.max(0, Math.min(1, score))
  })

  return { scores, arvores, amostra: tamanhoAmostra, limiar: 0.6 }
}

function padronizarRobusto(dados) {
  if (dados.length === 0) return { padronizados: [], medianas: [], iqrs: [] }
  const colunas = dados[0].map((_, indice) => dados.map((linha) => linha[indice]))
  const medianas = colunas.map(mediana)
  const iqrs = colunas.map((coluna) => {
    const ordenados = [...coluna].sort((a, b) => a - b)
    const q1 = ordenados[Math.floor((ordenados.length - 1) * 0.25)]
    const q3 = ordenados[Math.floor((ordenados.length - 1) * 0.75)]
    return q3 - q1 || 1
  })
  return {
    padronizados: dados.map((linha) =>
      linha.map((valor, indice) => (valor - medianas[indice]) / iqrs[indice]),
    ),
    medianas,
    iqrs,
  }
}

export function localOutlierFactor(dados, { k = 10, limiar = 2 } = {}) {  const total = dados.length
  if (total < 3) {
    return { scores: dados.map(() => 1), k: Math.max(1, total - 1), limiar }
  }

  const vizinhosK = Math.min(k, total - 1)
  const { padronizados } = padronizarRobusto(dados)
  const distancia = (a, b) => {
    let soma = 0
    for (let i = 0; i < a.length; i += 1) {
      const diferenca = a[i] - b[i]
      soma += diferenca * diferenca
    }
    return Math.sqrt(soma)
  }

  const vizinhos = padronizados.map((ponto, indice) => {
    const distancias = []
    for (let j = 0; j < total; j += 1) {
      if (j === indice) continue
      distancias.push([j, distancia(ponto, padronizados[j])])
    }
    distancias.sort((a, b) => a[1] - b[1])
    return distancias.slice(0, vizinhosK)
  })

  const kDistancia = vizinhos.map((lista) =>
    lista.length > 0 ? lista[lista.length - 1][1] : 0,
  )
  const alcancabilidade = (i, j) =>
    Math.max(kDistancia[i], distancia(padronizados[i], padronizados[j]))

  const densidade = vizinhos.map((lista, i) => {
    const soma = lista.reduce((totalSoma, [j]) => totalSoma + alcancabilidade(i, j), 0)
    return soma > 0 ? lista.length / soma : 0
  })

  const scores = vizinhos.map((lista, i) => {
    if (densidade[i] <= 0 || lista.length === 0) return 1
    const media =
      lista.reduce((soma, [j]) => soma + densidade[j] / densidade[i], 0) / lista.length
    return media
  })

  return { scores, k: vizinhosK, limiar }
}

export function amostraLof(total, scores, limite = 2000, semente = 42) {
  if (total <= limite) return Array.from({ length: total }, (_, indice) => indice)

  const rng = mulberry32(semente)
  const ordem = Array.from({ length: total }, (_, indice) => indice).sort(
    (a, b) => scores[b] - scores[a],
  )
  const escolhidos = ordem.slice(0, Math.min(500, total))
  const conjunto = new Set(escolhidos)

  const candidatos = Array.from({ length: total }, (_, indice) => indice).filter(
    (indice) => !conjunto.has(indice),
  )
  for (let i = candidatos.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]]
  }

  const faltam = limite - escolhidos.length
  for (let i = 0; i < faltam && i < candidatos.length; i += 1) {
    conjunto.add(candidatos[i])
    escolhidos.push(candidatos[i])
  }

  if (escolhidos.length < limite) {
    for (let i = 0; i < total && escolhidos.length < limite; i += 1) {
      if (conjunto.has(i)) continue
      conjunto.add(i)
      escolhidos.push(i)
    }
  }

  return escolhidos
}
