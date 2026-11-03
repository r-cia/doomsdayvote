import { describe, expect, it } from 'vitest';
import { compararVersoes } from '../../../src/modules/analise/versoes-bu.js';

describe('compararVersoes', () => {
  it('detecta campos e votaveis alterados', () => {
    const anterior = {
      qt_aptos: 100,
      qt_comparecimento: 80,
      resultados: [{ cd_tipo_votavel: 1, nr_votavel: 13, nm_votavel: 'A', qt_votos: 50 }],
    };
    const atual = {
      qt_aptos: 100,
      qt_comparecimento: 81,
      resultados: [{ cd_tipo_votavel: 1, nr_votavel: 13, nm_votavel: 'A', qt_votos: 51 }],
    };
    const r = compararVersoes(anterior, atual);
    expect(r.campos_alterados).toContainEqual({ campo: 'qt_comparecimento', anterior: 80, atual: 81, diferenca: 1 });
    expect(r.votaveis_alterados).toContainEqual({ nr_votavel: 13, nm_votavel: 'A', anterior: 50, atual: 51, diferenca: 1 });
    expect(r.causa).toBeNull();
  });

  it('trata ausencia como null', () => {
    const anterior = { resultados: [{ nr_votavel: 1, qt_votos: 5 }] };
    const atual = { resultados: [{ nr_votavel: 2, qt_votos: 7 }] };
    const r = compararVersoes(anterior, atual);
    const v1 = r.votaveis_alterados.find((v) => v.nr_votavel === 1);
    expect(v1.anterior).toBe(5);
    expect(v1.atual).toBeNull();
  });
});
