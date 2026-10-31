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

export function percentilRank(valores, valor) {
  const validos = finitos(valores);
  if (validos.length < 2 || typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  const menoresOuIguais = validos.filter((v) => v <= valor).length;
  return (menoresOuIguais / validos.length) * 100;
}
