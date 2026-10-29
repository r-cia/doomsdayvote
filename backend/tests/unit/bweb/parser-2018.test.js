import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { CAMPOS_2018_42 } from '../../../src/modules/importacao/bweb/campos.js';
import { lerArquivoBweb } from '../../../src/modules/importacao/bweb/ler-arquivo.js';
import { validarCabecalho2018 } from '../../../src/modules/importacao/bweb/parser-2018.js';

function fixture(nome) {
  return fileURLToPath(new URL(`../../fixtures/bweb/${nome}`, import.meta.url));
}

async function coletar(registros) {
  const lista = [];
  for await (const registro of registros) lista.push(registro);
  return lista;
}

describe('parser BWEB_2018_42', () => {
  it('lê 2.973 registros de AC 2º turno com aliases e recebimento ausente', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb_2t_AC_301020181744.csv'));
    const registros = await coletar(arquivo.registros);

    expect(arquivo.leiaute).toBe('BWEB_2018_42');
    expect(arquivo.camposAusentesNoLeiaute).toEqual(
      expect.arrayContaining(['DT_BU_RECEBIDO', 'DT_EMISSAO_BU', 'CD_TIPO_ELEICAO', 'NM_TIPO_ELEICAO']),
    );
    expect(registros).toHaveLength(2973);
    expect(arquivo.aliasesAplicados).toEqual(
      expect.arrayContaining([
        { de: 'SG_ UF', para: 'SG_UF' },
        { de: 'CD_FLASCARD_URNA_EFETIVADA', para: 'CD_FLASHCARD_URNA_EFETIVADA' },
        { de: 'DS_AGREGADAS', para: 'DS_SECOES_AGREGADAS' },
        { de: 'QT_ELEITORES_BIOMETRIA_NH', para: 'QT_ELEI_BIOM_SEM_HABILITACAO' },
      ]),
    );

    for (const registro of registros) {
      expect(registro.valores.ANO_ELEICAO).toBe(2018);
      expect(registro.valores.NR_TURNO).toBe(2);
      expect(registro.valores.SG_UF).toBe('AC');
      expect(registro.valores.DT_ELEICAO?.precisao).toBe('DATA');
      expect(registro.valores.DT_PLEITO?.precisao).toBe('DATA');
      expect(registro.valores.DT_BU_RECEBIDO).toBeNull();
      expect(registro.ausencias.DT_BU_RECEBIDO).toBe('INEXISTENTE_NO_LEIAUTE');
      expect(registro.valores.DT_EMISSAO_BU).toBeNull();
      expect(registro.ausencias.DT_EMISSAO_BU).toBe('INEXISTENTE_NO_LEIAUTE');
      expect(registro.valores.CD_TIPO_ELEICAO).toBeNull();
      expect(registro.valores.NM_TIPO_ELEICAO).toBeNull();
      expect(Object.keys(registro.bruto)).toHaveLength(42);
      expect(registro.erros.filter((e) => e.codigo === 'LARGURA_INVALIDA')).toEqual([]);
    }

    const comAgregadas = registros.find(
      (r) => r.bruto.DS_SECOES_AGREGADAS && !['#NULO#', '#NULO', '#NE'].includes(r.bruto.DS_SECOES_AGREGADAS),
    );
    expect(comAgregadas.valores.DS_SECOES_AGREGADAS).toBe(comAgregadas.bruto.DS_SECOES_AGREGADAS);

    const comBiometria = registros.find((r) => r.bruto.QT_ELEI_BIOM_SEM_HABILITACAO);
    expect(comBiometria.valores.QT_ELEI_BIOM_SEM_HABILITACAO).toBeTypeOf('number');
  });

  it('rejeita cabeçalho com DSELEICAO no lugar de DS_ELEICAO', () => {
    const campos = [...CAMPOS_2018_42];
    campos[campos.indexOf('DS_ELEICAO')] = 'DSELEICAO';

    try {
      validarCabecalho2018(campos);
      throw new Error('deveria ter lançado');
    } catch (erro) {
      expect(erro.codigo).toBe('MUDANCA_LEIAUTE');
      expect(erro.detalhes.faltando).toContain('DS_ELEICAO');
      expect(erro.detalhes.sobrando).toContain('DSELEICAO');
    }
  });

  it('lê o subset de AC 1º turno', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb_1t_AC_101020181938.csv'));
    const registros = await coletar(arquivo.registros);

    expect(registros).toHaveLength(300);
    for (const registro of registros) {
      expect(registro.valores.ANO_ELEICAO).toBe(2018);
      expect(registro.valores.NR_TURNO).toBe(1);
      expect(registro.valores.SG_UF).toBe('AC');
    }
  });
});
