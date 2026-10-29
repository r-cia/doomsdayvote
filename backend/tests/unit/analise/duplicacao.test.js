import { describe, expect, it } from 'vitest';
import { agruparAssinaturas } from '../../../src/modules/analise/duplicacao.js';

function secao({ id, zona = 1, numero = 1, municipio = 10, assinatura = 'a' }) {
  return {
    id,
    sg_uf: 'AC',
    cd_municipio_tse: municipio,
    nr_zona: zona,
    nr_secao: numero,
    assinatura,
    votaveis: 5,
  };
}

describe('agruparAssinaturas', () => {
  it('agrupa vetores idênticos e marca a proximidade', () => {
    const { grupos, total_grupos, total_secoes } = agruparAssinaturas([
      secao({ id: 's1', numero: 10, assinatura: 'a' }),
      secao({ id: 's2', numero: 11, assinatura: 'a' }),
      secao({ id: 's3', numero: 50, assinatura: 'b' }),
    ]);

    expect(total_grupos).toBe(1);
    expect(total_secoes).toBe(2);
    expect(grupos[0].secoes).toHaveLength(2);
    expect(grupos[0].mesma_zona).toBe(true);
    expect(grupos[0].mesmo_municipio).toBe(true);
    expect(grupos[0].secoes_consecutivas).toBe(true);
    expect(grupos[0].votaveis).toBe(5);
  });

  it('não marca proximidade entre municípios diferentes', () => {
    const { grupos } = agruparAssinaturas([
      secao({ id: 's1', municipio: 10, numero: 1 }),
      secao({ id: 's2', municipio: 20, zona: 2, numero: 900 }),
    ]);

    expect(grupos[0].mesma_zona).toBe(false);
    expect(grupos[0].mesmo_municipio).toBe(false);
    expect(grupos[0].secoes_consecutivas).toBe(false);
  });

  it('ignora assinaturas únicas e respeita o limite', () => {
    const unicas = agruparAssinaturas([secao({ id: 's1' })]);
    expect(unicas.grupos).toEqual([]);
    expect(unicas.total_grupos).toBe(0);

    const muitas = agruparAssinaturas(
      Array.from({ length: 10 }, (_, indice) => [
        secao({ id: `a${indice}`, assinatura: `g${indice}` }),
        secao({ id: `b${indice}`, numero: 2, assinatura: `g${indice}` }),
      ]).flat(),
      3,
    );
    expect(muitas.grupos).toHaveLength(3);
    expect(muitas.total_grupos).toBe(10);
  });
});
