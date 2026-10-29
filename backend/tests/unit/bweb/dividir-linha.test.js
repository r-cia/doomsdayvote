import { describe, expect, it } from 'vitest';
import { dividirLinhaBweb } from '../../../src/modules/importacao/bweb/leitor.js';

describe('dividirLinhaBweb', () => {
  it('separa por ponto e vírgula respeitando aspas e aspas escapadas', () => {
    expect(dividirLinhaBweb('"a";"b;c";"d""e"')).toEqual(['a', 'b;c', 'd"e']);
  });

  it('devolve 45 itens para uma linha de 45 campos entre aspas', () => {
    const linha = Array.from({ length: 45 }, (_, i) => `"c${i}"`).join(';');
    expect(dividirLinhaBweb(linha)).toHaveLength(45);
  });
});
