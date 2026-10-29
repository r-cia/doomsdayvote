const DIGITOS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const ESPERADO_BENFORD = Object.freeze(
  DIGITOS.map((digito) => Math.log10(1 + 1 / digito)),
)

export const LIMIAR_MAD = Object.freeze([
  { limite: 0.006, classificacao: 'conformidade próxima' },
  { limite: 0.012, classificacao: 'conformidade aceitável' },
  { limite: 0.015, classificacao: 'conformidade marginal' },
])

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
    digitos: DIGITOS.map((digito, indice) => ({
      digito,
      observado: observadas[indice],
      observado_percentual: percentuais[indice] * 100,
      esperado_percentual: ESPERADO_BENFORD[indice] * 100,
    })),
  }
}
