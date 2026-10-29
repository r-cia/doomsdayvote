import { describe, expect, it } from 'vitest';
import { interpretarNomeArquivo2014 } from '../../../src/modules/importacao/bweb/nome-arquivo-2014.js';

describe('interpretarNomeArquivo2014', () => {
  it('extrai turno, UF, geração e ano', () => {
    expect(interpretarNomeArquivo2014('bweb_1t_AC_14102014131600.txt')).toEqual({
      turno: 1,
      uf: 'AC',
      geracao: '2014-10-14 13:16:00',
      ano: 2014,
    });
    expect(interpretarNomeArquivo2014('bweb_2t_AC_28102014114450.txt')).toEqual({
      turno: 2,
      uf: 'AC',
      geracao: '2014-10-28 11:44:50',
      ano: 2014,
    });
    expect(interpretarNomeArquivo2014('BWEB_1T_AC_14102014131600.TXT')).toMatchObject({
      turno: 1,
      uf: 'AC',
    });
  });

  it('rejeita nomes fora do padrão', () => {
    for (const nome of ['bweb_3t_AC_14102014131600.txt', 'bweb_1t_AC_141020141316.txt', 'bweb-ac.csv']) {
      expect(() => interpretarNomeArquivo2014(nome)).toThrowError(
        expect.objectContaining({ codigo: 'NOME_ARQUIVO_2014_INVALIDO' }),
      );
    }
  });
});
