import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { lerArquivoBweb } from '../../../src/modules/importacao/bweb/ler-arquivo.js';

function fixture(nome) {
  return fileURLToPath(new URL(`../../fixtures/bweb/${nome}`, import.meta.url));
}

async function coletar(registros) {
  const lista = [];
  for await (const registro of registros) lista.push(registro);
  return lista;
}

describe('parser BWEB_45 — 2026', () => {
  it('lê 1.529 registros de AC 1º turno com precisão DATA_HORA', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb-1t_ac_2026.csv'));
    const registros = await coletar(arquivo.registros);

    expect(arquivo.leiaute).toBe('BWEB_45');
    expect(arquivo.camposAusentesNoLeiaute).toContain('DT_ELEICAO');
    expect(registros).toHaveLength(1529);

    for (const registro of registros) {
      expect(registro.valores.ANO_ELEICAO).toBe(2026);
      expect(registro.valores.NR_TURNO).toBe(1);
      expect(registro.valores.SG_UF).toBe('AC');
      expect(registro.valores.DT_BU_RECEBIDO.precisao).toBe('DATA_HORA');
      expect(registro.valores.CD_TIPO_URNA).toBe(1);
      expect(registro.valores.DT_ELEICAO).toBeNull();
      expect(registro.ausencias.DT_ELEICAO).toBe('INEXISTENTE_NO_LEIAUTE');
      expect(Object.keys(registro.bruto)).toHaveLength(45);
      expect(registro.erros.filter((e) => ['TIPO_INVALIDO', 'LARGURA_INVALIDA'].includes(e.codigo))).toEqual([]);
    }

    const locais = registros.map((r) => r.valores.DT_BU_RECEBIDO.local).sort();
    expect(locais[0]).toBe('2026-10-04 17:08:44');
    expect(locais[locais.length - 1]).toBe('2026-10-04 20:40:01');

    const cargos = new Set(registros.map((r) => r.valores.DS_CARGO_PERGUNTA));
    expect(cargos).toEqual(
      new Set(['Presidente', 'Governador', 'Senador', 'Deputado Federal', 'Deputado Estadual']),
    );

    const municipioAcentuado = registros.some((r) => /[^\x00-\x7F]/.test(r.valores.NM_MUNICIPIO ?? ''));
    expect(municipioAcentuado).toBe(true);
    expect(registros.some((r) => (r.valores.NM_MUNICIPIO ?? '').includes('\uFFFD'))).toBe(false);
  });
});

describe('parser BWEB_45 — 2022', () => {
  it('aplica aliases e separa geração de recebimento', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb_1t_AC_051020221321.csv'));
    const registros = await coletar(arquivo.registros);

    expect(registros).toHaveLength(6545);
    expect(arquivo.aliasesAplicados).toEqual(
      expect.arrayContaining([
        { de: 'DS_AGREGADAS', para: 'DS_SECOES_AGREGADAS' },
        { de: 'QT_ELEITORES_BIOMETRIA_NH', para: 'QT_ELEI_BIOM_SEM_HABILITACAO' },
      ]),
    );

    const comAlias = registros.find(
      (r) =>
        r.bruto.DS_SECOES_AGREGADAS &&
        !['#NULO#', '#NULO', '#NE'].includes(r.bruto.DS_SECOES_AGREGADAS),
    );
    expect(comAlias).toBeDefined();
    expect(comAlias.valores.DS_SECOES_AGREGADAS).toBe(comAlias.bruto.DS_SECOES_AGREGADAS);
    expect(comAlias.valores.DT_BU_RECEBIDO.precisao).toBe('DATA_HORA');
    expect(comAlias.valores.DT_GERACAO.precisao).toBe('DATA_HORA');
    expect(comAlias.valores.DT_GERACAO.local).not.toBe(comAlias.valores.DT_BU_RECEBIDO.local);
  });
});
