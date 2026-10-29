import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { CAMPOS_45 } from '../../../src/modules/importacao/bweb/campos.js';
import { detectarLeiaute, detectarLeiauteDeCampos } from '../../../src/modules/importacao/bweb/detectar-leiaute.js';
import { validarCabecalho45 } from '../../../src/modules/importacao/bweb/parser-45.js';

function fixture(nome) {
  return fileURLToPath(new URL(`../../fixtures/bweb/${nome}`, import.meta.url));
}

describe('detectarLeiaute', () => {
  it('detecta os leiautes das fixtures disponíveis', async () => {
    expect(await detectarLeiaute(fixture('bweb-1t_ac_2026.csv'))).toBe('BWEB_45');
    expect(await detectarLeiaute(fixture('bweb_1t_AC_051020221321.csv'))).toBe('BWEB_45');
    expect(await detectarLeiaute(fixture('bweb_2t_AC_301020181744.csv'))).toBe('BWEB_2018_42');
    expect(await detectarLeiaute(fixture('bweb_1t_AC_14102014131600.txt'))).toBe('BWEB_2014_31');
  });

  it('rejeita cabeçalho com quantidade desconhecida', () => {
    expect(() => detectarLeiauteDeCampos(Array.from({ length: 44 }, () => 'X'))).toThrowError(
      expect.objectContaining({ codigo: 'LEIAUTE_DESCONHECIDO' }),
    );
  });

  it('rejeita cabeçalho de 45 com campo trocado', () => {
    const campos = [...CAMPOS_45];
    campos[campos.indexOf('NR_TURMA_APURADORA')] = 'XX_NOVO';

    try {
      validarCabecalho45(campos);
      throw new Error('deveria ter lançado');
    } catch (erro) {
      expect(erro.codigo).toBe('MUDANCA_LEIAUTE');
      expect(erro.detalhes.faltando).toContain('NR_TURMA_APURADORA');
      expect(erro.detalhes.sobrando).toContain('XX_NOVO');
    }
  });
});
