function finitos(valores) {
  return valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
}

export function toNumberOrNull(valor) {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function mediana(valores) {
  const validos = finitos(valores).sort((a, b) => a - b);
  if (validos.length === 0) return null;
  const meio = Math.floor(validos.length / 2);
  if (validos.length % 2 === 1) return validos[meio];
  return (validos[meio - 1] + validos[meio]) / 2;
}

export function media(valores) {
  const validos = finitos(valores);
  if (validos.length === 0) return null;
  return validos.reduce((soma, v) => soma + v, 0) / validos.length;
}

export function desvioPadrao(valores) {
  const validos = finitos(valores);
  if (validos.length === 0) return null;
  const m = media(validos);
  const variancia = validos.reduce((soma, v) => soma + (v - m) ** 2, 0) / validos.length;
  return Math.sqrt(variancia);
}

export function criarPercentilRank(valores) {
  const ordenados = finitos(valores).sort((a, b) => a - b);
  return (valor) => {
    if (ordenados.length < 2 || typeof valor !== 'number' || !Number.isFinite(valor)) return null;
    let inicio = 0;
    let fim = ordenados.length;
    while (inicio < fim) {
      const meio = (inicio + fim) >> 1;
      if (ordenados[meio] <= valor) inicio = meio + 1;
      else fim = meio;
    }
    return (inicio / ordenados.length) * 100;
  };
}

export function percentilRank(valores, valor) {
  return criarPercentilRank(valores)(valor);
}
