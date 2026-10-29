import { describe, expect, it } from 'vitest';
import { categorizar } from '../../src/modules/apuracao/categoria-votavel.js';

describe('categorizar votável', () => {
  it('classifica por número e tipo', () => {
    expect(categorizar({ cd_tipo_votavel: 1, nr_votavel: 13 })).toBe('nominal');
    expect(categorizar({ cd_tipo_votavel: 1, nr_votavel: 95 })).toBe('branco');
    expect(categorizar({ cd_tipo_votavel: 1, nr_votavel: 96 })).toBe('nulo');
    expect(categorizar({ cd_tipo_votavel: 1, nr_votavel: 97 })).toBe('anulado_apurado_separado');
    expect(categorizar({ cd_tipo_votavel: 1, nr_votavel: 98 })).toBe('anulado');
    expect(categorizar({ cd_tipo_votavel: 2, ds_tipo_votavel: 'Legenda', nr_votavel: 13 })).toBe('legenda');
    expect(categorizar({ cd_tipo_votavel: 9, ds_tipo_votavel: 'Xyz', nr_votavel: 1 })).toBe('outro');
  });
});
