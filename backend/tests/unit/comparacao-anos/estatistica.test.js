import { describe, expect, it } from 'vitest';
import { correlacao, pearson, pValorPermutacaoBlocos } from '../../../src/modules/comparacao-anos/estatistica.js';

const sequencia = Array.from({ length: 18 }, (_, indice) => indice + 1);

describe('pearson', () => {
  it('retorna 1 e -1 para relações lineares perfeitas', () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 12);
    expect(pearson([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1, 12);
  });

  it('calcula o valor conhecido 0,8', () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])).toBeCloseTo(0.8, 12);
  });

  it('retorna null com menos de 2 pontos ou variância zero', () => {
    expect(pearson([1], [1])).toBeNull();
    expect(pearson([], [])).toBeNull();
    expect(pearson([1, 2, 3], [4, 4, 4])).toBeNull();
  });
});

describe('pValorPermutacaoBlocos', () => {
  it('é determinístico para a mesma semente', () => {
    const invertida = [...sequencia].reverse();
    const ruidosa = sequencia.map((valor, indice) => valor + (indice % 3));
    expect(pValorPermutacaoBlocos(sequencia, ruidosa)).toBe(pValorPermutacaoBlocos(sequencia, ruidosa));
    expect(pValorPermutacaoBlocos(sequencia, invertida, { semente: 7 })).toBe(
      pValorPermutacaoBlocos(sequencia, invertida, { semente: 7 }),
    );
  });

  it('usa (contagem + 1) / (N + 1)', () => {
    expect(pValorPermutacaoBlocos(sequencia, sequencia, { permutacoes: 0 })).toBe(1);
    const p = pValorPermutacaoBlocos(sequencia, sequencia, { permutacoes: 99 });
    expect((p * 100) % 1).toBeCloseTo(0, 9);
  });

  it('com 3 blocos e correlação máxima, apenas a ordem original empata com o observado', () => {
    const p = pValorPermutacaoBlocos(sequencia, sequencia);
    expect(p).toBeGreaterThan(1 / 6 - 0.03);
    expect(p).toBeLessThan(1 / 6 + 0.03);
  });

  it('retorna null quando a correlação não é calculável', () => {
    expect(pValorPermutacaoBlocos([1], [1])).toBeNull();
    expect(pValorPermutacaoBlocos([1, 2, 3], [4, 4, 4])).toBeNull();
  });
});

describe('correlacao', () => {
  it('devolve r e p_valor, ou nulos quando não calculável', () => {
    const calculada = correlacao(sequencia, sequencia);
    expect(calculada.r).toBeCloseTo(1, 12);
    expect(calculada.p_valor).toBeGreaterThan(0);
    expect(correlacao([1], [1])).toEqual({ r: null, p_valor: null });
  });
});
