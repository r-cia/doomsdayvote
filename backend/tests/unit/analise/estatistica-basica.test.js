import { describe, expect, it } from 'vitest';
import { criarPercentilRank, percentilRank } from '../../../src/modules/analise/estatistica-basica.js';

describe('percentilRank', () => {
  it('conta valores menores ou iguais, inclusive empates', () => {
    expect(percentilRank([1, 2, 2, 4], 2)).toBe(75);
    expect(percentilRank([1, 2, 2, 4], 4)).toBe(100);
    expect(percentilRank([1, 2, 2, 4], 0)).toBe(0);
  });

  it('ignora valores não numéricos e exige ao menos dois válidos', () => {
    expect(percentilRank([1, null, undefined, NaN, 3], 3)).toBe(100);
    expect(percentilRank([5], 5)).toBeNull();
    expect(percentilRank([1, 2], null)).toBeNull();
    expect(percentilRank([1, 2], NaN)).toBeNull();
  });

  it('o ranqueador criado reaproveita os valores ordenados', () => {
    const rank = criarPercentilRank([3, 1, 2, 4]);
    expect(rank(2)).toBe(50);
    expect(rank(3)).toBe(75);
  });
});
