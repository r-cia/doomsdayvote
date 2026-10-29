import { describe, expect, it } from 'vitest';
import {
  amostraLof,
  isolationForest,
  localOutlierFactor,
  padronizarRobusto,
} from '../../../src/modules/analise/outliers.js';

function gerador(semente = 7) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

function nuvem(quantidade) {
  const rng = gerador();
  return Array.from({ length: quantidade }, () => [
    rng(),
    rng(),
    rng(),
  ]);
}

describe('isolationForest', () => {
  it('dá o maior score ao ponto distante', () => {
    const dados = [...nuvem(200), [10, 10, 10]];
    const { scores, limiar } = isolationForest(dados, { semente: 42 });

    expect(scores).toHaveLength(dados.length);
    const ultimo = scores[scores.length - 1];
    expect(ultimo).toBeGreaterThan(limiar);
    expect(ultimo).toBe(Math.max(...scores));
  });

  it('é determinístico para a mesma semente', () => {
    const dados = nuvem(50);
    const a = isolationForest(dados, { semente: 7 });
    const b = isolationForest(dados, { semente: 7 });
    expect(a.scores).toEqual(b.scores);
  });

  it('não quebra com poucos pontos', () => {
    expect(isolationForest([]).scores).toEqual([]);
    expect(isolationForest([[1, 2]]).scores).toEqual([0.5]);
  });
});

describe('localOutlierFactor', () => {
  it('dá LOF acima do limiar ao ponto distante', () => {
    const dados = [...nuvem(120), [10, 10, 10]];
    const { scores, limiar, k } = localOutlierFactor(dados, { k: 10 });

    expect(k).toBe(10);
    expect(scores).toHaveLength(dados.length);
    const ultimo = scores[scores.length - 1];
    expect(ultimo).toBeGreaterThan(limiar);
    expect(ultimo).toBe(Math.max(...scores));
  });

  it('devolve score 1 quando não há vizinhança suficiente', () => {
    const { scores } = localOutlierFactor([[0], [1]], { k: 5 });
    expect(scores).toEqual([1, 1]);
  });
});

describe('padronizarRobusto', () => {
  it('centraliza na mediana e escala pelo IQR', () => {
    const { padronizados, medianas } = padronizarRobusto([
      [1, 10],
      [2, 20],
      [3, 30],
      [4, 40],
      [100, 50],
    ]);
    expect(medianas).toEqual([3, 30]);
    expect(padronizados[2]).toEqual([0, 0]);
    expect(Math.abs(padronizados[4][0])).toBeGreaterThan(10);
  });
});

describe('amostraLof', () => {
  it('devolve tudo quando cabe no limite', () => {
    expect(amostraLof(10, Array(10).fill(0), 2000)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('limita e inclui os maiores scores', () => {
    const scores = Array.from({ length: 5000 }, (_, indice) => indice / 5000);
    const indices = amostraLof(5000, scores, 2000);
    expect(indices).toHaveLength(2000);
    expect(new Set(indices).size).toBe(2000);
    expect(indices).toContain(4999);
  });
});
