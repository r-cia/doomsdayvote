export const TAMANHO_BLOCO = 6;
export const PERMUTACOES = 10000;
export const SEMENTE = 20261031;

function mulberry32(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function somas(valores) {
  let soma = 0;
  let quadrados = 0;
  for (const valor of valores) {
    soma += valor;
    quadrados += valor * valor;
  }
  return { soma, quadrados };
}

function denominador(n, x, y) {
  const produto = (n * x.quadrados - x.soma * x.soma) * (n * y.quadrados - y.soma * y.soma);
  return produto > 0 ? Math.sqrt(produto) : null;
}

export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;
  const x = somas(xs);
  const y = somas(ys);
  const base = denominador(n, x, y);
  if (base === null) return null;
  let produtos = 0;
  for (let i = 0; i < n; i += 1) produtos += xs[i] * ys[i];
  return (n * produtos - x.soma * y.soma) / base;
}

export function pValorPermutacaoBlocos(
  xs,
  ys,
  { tamanhoBloco = TAMANHO_BLOCO, permutacoes = PERMUTACOES, semente = SEMENTE } = {},
) {
  const n = xs.length;
  const observado = pearson(xs, ys);
  if (observado === null) return null;

  const x = somas(xs);
  const y = somas(ys);
  const base = denominador(n, x, y);

  const blocos = [];
  for (let inicio = 0; inicio < n; inicio += tamanhoBloco) {
    blocos.push([inicio, Math.min(inicio + tamanhoBloco, n)]);
  }

  const aleatorio = mulberry32(semente);
  const ordem = blocos.map((_, indice) => indice);
  let maioresOuIguais = 0;

  for (let rodada = 0; rodada < permutacoes; rodada += 1) {
    for (let i = ordem.length - 1; i > 0; i -= 1) {
      const j = Math.floor(aleatorio() * (i + 1));
      [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    }
    let produtos = 0;
    let posicao = 0;
    for (const indice of ordem) {
      const [inicio, fim] = blocos[indice];
      for (let k = inicio; k < fim; k += 1) {
        produtos += xs[posicao] * ys[k];
        posicao += 1;
      }
    }
    if ((n * produtos - x.soma * y.soma) / base >= observado) maioresOuIguais += 1;
  }

  return (maioresOuIguais + 1) / (permutacoes + 1);
}

export function correlacao(xs, ys, opcoes) {
  const r = pearson(xs, ys);
  if (r === null) return { r: null, p_valor: null };
  return { r, p_valor: pValorPermutacaoBlocos(xs, ys, opcoes) };
}
