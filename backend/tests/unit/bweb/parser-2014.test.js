import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lerArquivoBweb } from '../../../src/modules/importacao/bweb/ler-arquivo.js';
import { dividirLinhaBweb } from '../../../src/modules/importacao/bweb/leitor.js';
import { interpretarNomeArquivo2014 } from '../../../src/modules/importacao/bweb/nome-arquivo-2014.js';
import { parsearRegistro2014 } from '../../../src/modules/importacao/bweb/parser-2014.js';
import { gerarBweb2014 } from '../../helpers/dados-sinteticos.js';

const NOME_2014 = 'bweb_1t_AC_14102014131600.txt';

let diretorio;

async function coletar(registros) {
  const lista = [];
  for await (const registro of registros) lista.push(registro);
  return lista;
}

describe('parser BWEB_2014_31', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-2014-'));
    await writeFile(path.join(diretorio, NOME_2014), gerarBweb2014(), 'latin1');
  });

  afterAll(async () => {
    await rm(diretorio, { recursive: true, force: true });
  });

  it('mapeia as colunas posicionais e deriva ano, turno e sigla do partido', () => {
    const derivados = interpretarNomeArquivo2014(NOME_2014);
    const registro = parsearRegistro2014(dividirLinhaBweb(gerarBweb2014().split('\n')[0]), 1, derivados);

    expect(registro.valores.DT_BU_RECEBIDO).toMatchObject({
      precisao: 'DATA',
      data: '2014-10-14',
      local: null,
    });
    expect(registro.valores.QT_APTOS).toBe(100);
    expect(registro.valores.QT_ABSTENCOES).toBe(10);
    expect(registro.valores.QT_COMPARECIMENTO).toBe(90);
    expect(registro.valores.CD_TIPO_ELEICAO).toBe(0);
    expect(registro.valores.CD_TIPO_URNA).toBe(1);
    expect(registro.valores.ANO_ELEICAO).toBe(2014);
    expect(registro.valores.NR_TURNO).toBe(1);
    expect(registro.bruto.ANO_ELEICAO).toBeUndefined();
    expect(registro.bruto.NR_TURNO).toBeUndefined();

    expect(registro.valores.NM_PARTIDO).toBe('PT');
    expect(registro.valores.SG_PARTIDO).toBe('PT');
    expect(registro.ausencias.SG_PARTIDO).toBeUndefined();
  });

  it('deixa SG_PARTIDO sem valor quando NM_PARTIDO está vazio', () => {
    const derivados = interpretarNomeArquivo2014(NOME_2014);
    const linha = dividirLinhaBweb(gerarBweb2014().split('\n')[0]);
    linha[11] = '';
    const registro = parsearRegistro2014(linha, 1, derivados);

    expect(registro.valores.SG_PARTIDO).toBeNull();
    expect(registro.ausencias.SG_PARTIDO).toBe('INEXISTENTE_NO_LEIAUTE');
  });

  it('sinaliza linha com largura diferente de 31', () => {
    const derivados = interpretarNomeArquivo2014(NOME_2014);
    const registro = parsearRegistro2014(
      dividirLinhaBweb(gerarBweb2014().split('\n')[0]).slice(0, 30),
      1,
      derivados,
    );

    expect(registro.erros).toEqual(
      expect.arrayContaining([expect.objectContaining({ codigo: 'LARGURA_INVALIDA' })]),
    );
  });

  it('lê o arquivo sintético com os metadados derivados do nome', async () => {
    const arquivo = await lerArquivoBweb(path.join(diretorio, NOME_2014));
    const registros = await coletar(arquivo.registros);

    expect(arquivo.leiaute).toBe('BWEB_2014_31');
    expect(arquivo.metadadosDerivados).toMatchObject({
      campos: ['ANO_ELEICAO', 'NR_TURNO'],
      origem: 'nome_arquivo',
      valores: { ANO_ELEICAO: 2014, NR_TURNO: 1 },
    });
    expect(registros).toHaveLength(4);

    for (const registro of registros) {
      expect(registro.valores.ANO_ELEICAO).toBe(2014);
      expect(registro.valores.NR_TURNO).toBe(1);
      expect(registro.valores.SG_UF).toBe('AC');
      expect(registro.valores.DT_BU_RECEBIDO.precisao).toBe('DATA');
      expect(registro.valores.DT_BU_RECEBIDO.local).toBeNull();
      expect(registro.valores.DT_PLEITO).toBeNull();
      expect(registro.ausencias.DT_PLEITO).toBe('INEXISTENTE_NO_LEIAUTE');
      expect(Object.keys(registro.bruto)).toHaveLength(31);
      expect(registro.erros.filter((e) => e.codigo === 'METADADO_DERIVADO_DIVERGENTE')).toEqual([]);
    }
  });

  it('descarta cargos fora do escopo', async () => {
    const caminho = path.join(diretorio, 'bweb_1t_AC_14102014131600.csv');
    await writeFile(caminho, gerarBweb2014({ incluirForaDoEscopo: true }), 'latin1');

    const metricas = { registrosIgnorados: 0 };
    const arquivo = await lerArquivoBweb(caminho, { metricas });
    const registros = await coletar(arquivo.registros);

    expect(new Set(registros.map((registro) => registro.valores.DS_CARGO_PERGUNTA))).toEqual(
      new Set(['Presidente', 'Governador']),
    );
    expect(metricas.registrosIgnorados).toBe(2);
  });
});
