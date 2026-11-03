import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CAMPOS_45 } from '../../../src/modules/importacao/bweb/campos.js';
import { detectarLeiaute, detectarLeiauteDeCampos } from '../../../src/modules/importacao/bweb/detectar-leiaute.js';
import { validarCabecalho45 } from '../../../src/modules/importacao/bweb/parser-45.js';
import { gerarBweb2014, gerarBweb2018, gerarBweb45 } from '../../helpers/dados-sinteticos.js';

let diretorio;

function arquivo(nome) {
  return path.join(diretorio, nome);
}

describe('detectarLeiaute', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-leiaute-'));
    await writeFile(arquivo('bweb_1t_AC_14102014131600.txt'), gerarBweb2014(), 'latin1');
    await writeFile(arquivo('bweb_2t_AC_301020181744.csv'), gerarBweb2018(), 'latin1');
    await writeFile(arquivo('bweb-1t_ac_2026.csv'), gerarBweb45(), 'latin1');
  });

  afterAll(async () => {
    await rm(diretorio, { recursive: true, force: true });
  });

  it('detecta os três leiautes a partir do cabeçalho', async () => {
    expect(await detectarLeiaute(arquivo('bweb-1t_ac_2026.csv'))).toBe('BWEB_45');
    expect(await detectarLeiaute(arquivo('bweb_2t_AC_301020181744.csv'))).toBe('BWEB_2018_42');
    expect(await detectarLeiaute(arquivo('bweb_1t_AC_14102014131600.txt'))).toBe('BWEB_2014_31');
  });

  it('detecta 2014 apenas pela quantidade de colunas', () => {
    expect(detectarLeiauteDeCampos(Array.from({ length: 31 }, () => 'X'))).toBe('BWEB_2014_31');
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
