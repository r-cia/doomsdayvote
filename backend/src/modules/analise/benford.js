const DIGITOS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
export const SIMULACOES_BENFORD = 10_000
const distribuicoesMonteCarlo = new Map()

export const ESPERADO_BENFORD = Object.freeze(
  DIGITOS.map((digito) => Math.log10(1 + 1 / digito)),
)

export const LIMIAR_MAD = Object.freeze([
  { limite: 0.006, classificacao: 'conformidade próxima' },
  { limite: 0.012, classificacao: 'conformidade aceitável' },
  { limite: 0.015, classificacao: 'conformidade marginal' },
])

function distribuicaoMonteCarlo(n) {
  if (distribuicoesMonteCarlo.has(n)) {
    const distribuicao = distribuicoesMonteCarlo.get(n)
    distribuicoesMonteCarlo.delete(n)
    distribuicoesMonteCarlo.set(n, distribuicao)
    return distribuicao
  }

  let estado = (n ^ 0x9e3779b9) >>> 0 || 1
  const aleatorio = () => {
    estado ^= estado << 13
    estado ^= estado >>> 17
    estado ^= estado << 5
    return (estado >>> 0) / 0x1_0000_0000
  }
  const acumuladas = []
  let acumulado = 0
  for (const esperado of ESPERADO_BENFORD) {
    acumulado += esperado
    acumuladas.push(acumulado)
  }

  const proporcoes = DIGITOS.map(() => new Float64Array(SIMULACOES_BENFORD))
  const mads = Array.from({ length: SIMULACOES_BENFORD }, (_, simulacao) => {
    const observadas = Array(9).fill(0)
    for (let indice = 0; indice < n; indice += 1) {
      const sorteio = aleatorio()
      let inicio = 0
      let fim = acumuladas.length - 1
      while (inicio < fim) {
        const meio = (inicio + fim) >>> 1
        if (sorteio < acumuladas[meio]) fim = meio
        else inicio = meio + 1
      }
      observadas[inicio] += 1
    }
    observadas.forEach((quantidade, indice) => {
      proporcoes[indice][simulacao] = quantidade / n
    })
    return observadas.reduce(
      (total, quantidade, indice) =>
        total + Math.abs(quantidade / n - ESPERADO_BENFORD[indice]),
      0,
    ) / DIGITOS.length
  }).sort((a, b) => a - b)

  const posicaoInferior = Math.ceil(0.025 * SIMULACOES_BENFORD) - 1
  const posicaoSuperior = Math.ceil(0.975 * SIMULACOES_BENFORD) - 1
  const faixa = proporcoes.map((valores, indice) => {
    valores.sort()
    return {
      digito: DIGITOS[indice],
      p025: valores[posicaoInferior] * 100,
      p975: valores[posicaoSuperior] * 100,
    }
  })

  const distribuicao = { mads, faixa }
  distribuicoesMonteCarlo.set(n, distribuicao)
  // shortcut: 64 tamanhos limitam o cache a ~5 MB; elevar se uma resposta repetir n após a 64ª chave.
  if (distribuicoesMonteCarlo.size > 64) {
    distribuicoesMonteCarlo.delete(distribuicoesMonteCarlo.keys().next().value)
  }
  return distribuicao
}

function pValorMonteCarlo(n, mad) {
  const { mads } = distribuicaoMonteCarlo(n)
  let inicio = 0
  let fim = mads.length
  while (inicio < fim) {
    const meio = (inicio + fim) >>> 1
    if (mads[meio] < mad) inicio = meio + 1
    else fim = meio
  }
  return (mads.length - inicio + 1) / (mads.length + 1)
}

export function primeiroDigito(valor) {
  const numero = Math.abs(Number(valor))
  if (!Number.isFinite(numero) || numero < 1) return null
  return Number(String(Math.trunc(numero))[0])
}

export function classificarMad(mad) {
  if (mad === null || mad === undefined || !Number.isFinite(Number(mad))) {
    return null
  }
  const valor = Number(mad)
  for (const faixa of LIMIAR_MAD) {
    if (valor < faixa.limite) return faixa.classificacao
  }
  return 'não conformidade'
}

export function calcularBenford(contagens = []) {
  const observadas = Array(9).fill(0)

  for (const valor of contagens) {
    const digito = primeiroDigito(valor)
    if (digito) observadas[digito - 1] += 1
  }

  const n = observadas.reduce((total, quantidade) => total + quantidade, 0)
  if (n === 0) {
    return {
      n: 0,
      mad: null,
      classificacao: null,
      monte_carlo: { simulacoes: SIMULACOES_BENFORD, p_valor: null, faixa_digitos: null },
      digitos: DIGITOS.map((digito, indice) => ({
        digito,
        observado: 0,
        observado_percentual: 0,
        esperado_percentual: ESPERADO_BENFORD[indice] * 100,
      })),
    }
  }

  const percentuais = observadas.map((quantidade) => quantidade / n)
  const mad =
    percentuais.reduce(
      (total, percentual, indice) =>
        total + Math.abs(percentual - ESPERADO_BENFORD[indice]),
      0,
    ) / DIGITOS.length

  return {
    n,
    mad,
    classificacao: classificarMad(mad),
    monte_carlo: {
      simulacoes: SIMULACOES_BENFORD,
      p_valor: pValorMonteCarlo(n, mad),
      faixa_digitos: distribuicaoMonteCarlo(n).faixa,
    },
    digitos: DIGITOS.map((digito, indice) => ({
      digito,
      observado: observadas[indice],
      observado_percentual: percentuais[indice] * 100,
      esperado_percentual: ESPERADO_BENFORD[indice] * 100,
    })),
  }
}
