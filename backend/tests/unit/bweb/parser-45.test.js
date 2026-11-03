import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lerArquivoBweb } from '../../../src/modules/importacao/bweb/ler-arquivo.js';
import { gerarBweb45 } from '../../helpers/dados-sinteticos.js';

const NOME_2026 = 'bweb-1t_ac_2026.csv';

let diretorio;

async function coletar(registros) {
  const lista = [];
  for await (const registro of registros) lista.push(registro);
  return lista;
}

describe('parser BWEB_45 — 2026', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-45-'));
    await writeFile(path.join(diretorio, NOME_2026), gerarBweb45(), 'latin1');
  });

  afterAll(async () => {
    await rm(diretorio, { recursive: true, force: true });
  });

  it('lê o CSV sintético com precisão DATA_HORA e sem DT_ELEICAO', async () => {
    const arquivo = await lerArquivoBweb(path.join(diretorio, NOME_2026));
    const registros = await coletar(arquivo.registros);

    expect(arquivo.leiaute).toBe('BWEB_45');
    expect(arquivo.camposAusentesNoLeiaute).toContain('DT_ELEICAO');
    expect(registros).toHaveLength(6);

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

    const primeira = registros[0];
    expect(primeira.valores.DT_GERACAO.local).toBe('2026-10-04 17:10:00');
    expect(primeira.valores.DT_BU_RECEBIDO.local).toBe('2026-10-04 17:20:00');
    expect(primeira.valores.DT_GERACAO.local).not.toBe(primeira.valores.DT_BU_RECEBIDO.local);

    expect(new Set(registros.map((registro) => registro.valores.DS_CARGO_PERGUNTA))).toEqual(
      new Set(['Presidente', 'Governador']),
    );
  });

  it('descarta senador e deputados sem flag de configuração', async () => {
    const caminho = path.join(diretorio, 'bweb-1t_ac_2026_com_fora.csv');
    await writeFile(caminho, gerarBweb45({ incluirForaDoEscopo: true }), 'latin1');

    const metricas = { registrosIgnorados: 0 };
    const arquivo = await lerArquivoBweb(caminho, { metricas });
    const registros = await coletar(arquivo.registros);

    expect(new Set(registros.map((registro) => registro.valores.DS_CARGO_PERGUNTA))).toEqual(
      new Set(['Presidente', 'Governador']),
    );
    expect(metricas.registrosIgnorados).toBe(2);
  });
});
