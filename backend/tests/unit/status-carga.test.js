import { describe, expect, it } from 'vitest';
import { coletarStatus, formatarStatus } from '../../src/modules/importacao/status-carga.js';

function criarDbFalso(resultados) {
  const fila = resultados.map((linhas) => [...linhas]);
  const executor = {
    transformQuery: (node) => node,
    compileQuery: () => ({}),
    executeQuery: async () => ({ rows: fila.shift() ?? [] }),
  };
  return { getExecutor: () => executor, restantes: () => fila.length };
}

const inicio = new Date('2022-10-02T12:00:00.000Z');
const fim = new Date('2022-10-02T12:01:00.000Z');

describe('carga:status', () => {
  it('resume última carga, falhas e UFs sem arquivo', async () => {
    const db = criarDbFalso([
      [
        {
          lote_id: 'lote-sp',
          arquivo: 'bu_2022_1_sp.zip',
          ano_eleicao: 2022,
          nr_turno: 1,
          sg_uf: 'SP',
          status: 'concluido',
          iniciado_em: inicio,
          concluido_em: fim,
          duracao_ms: 60000,
        },
      ],
      [
        {
          lote_id: 'lote-mg',
          arquivo: 'bu_2022_2_mg.zip',
          ano_eleicao: 2022,
          nr_turno: 2,
          sg_uf: 'MG',
          status: 'falhou',
          iniciado_em: inicio,
          concluido_em: fim,
          duracao_ms: 1000,
          erro_codigo: null,
          erro_mensagem: null,
        },
      ],
      [
        {
          lote_id: 'lote-bweb',
          arquivo: 'bweb.csv',
          ano_eleicao: null,
          nr_turno: null,
          sg_uf: null,
          status: 'falhou',
          iniciado_em: inicio,
          concluido_em: fim,
          duracao_ms: null,
          erro_codigo: 'ERRO_INTERNO',
          erro_mensagem: 'falhou',
        },
      ],
      [],
      [],
    ]);

    const status = await coletarStatus(db);

    expect(status.ultima_por_uf).toEqual([
      {
        lote_id: 'lote-sp',
        arquivo: 'bu_2022_1_sp.zip',
        ano: 2022,
        turno: 1,
        uf: 'SP',
        status: 'concluido',
        iniciado_em: '2022-10-02T12:00:00.000Z',
        concluido_em: '2022-10-02T12:01:00.000Z',
        duracao_ms: 60000,
      },
    ]);
    expect(status.lotes_com_falha.map((item) => item.origem)).toEqual(['totalizacao', 'bweb']);
    expect(status.lotes_com_falha[1]).toMatchObject({
      origem: 'bweb',
      lote_id: 'lote-bweb',
      erro_codigo: 'ERRO_INTERNO',
    });
    expect(status.lotes_parciais).toEqual([]);
    expect(status.secoes_com_erro).toEqual([]);
    expect(status.lotes_substituidos).toEqual([]);
    expect(db.restantes()).toBe(0);

    const texto = formatarStatus(status);
    expect(texto).toContain('Última carga por ano/turno/UF');
    expect(texto).toContain('2022 T1 SP: concluido bu_2022_1_sp.zip (60.0s)');
    expect(texto).toContain('Lotes com falha');
    expect(texto).toContain('bweb lote-bweb bweb.csv ERRO_INTERNO: falhou');
  });

  it('detalha um lote da totalização com contagens agregadas', async () => {
    const db = criarDbFalso([
      [
        {
          lote_id: 'lote-sp',
          arquivo: 'bu_2022_1_sp.zip',
          ano_eleicao: 2022,
          nr_turno: 1,
          sg_uf: 'SP',
          status: 'concluido',
          iniciado_em: inicio,
          concluido_em: fim,
          duracao_ms: 60000,
        },
      ],
      [{ secoes: 12, divergencias: 3 }],
    ]);

    const lote = await coletarStatus(db, { lote: '00000000-0000-0000-0000-000000000000' });

    expect(lote).toMatchObject({
      origem: 'totalizacao',
      lote_id: 'lote-sp',
      uf: 'SP',
      secoes: 12,
      divergencias: 3,
    });
    expect(formatarStatus(lote)).toContain('secoes: 12');
    expect(db.restantes()).toBe(0);
  });

  it('detalha um lote da carga BWEB quando não há totalização', async () => {
    const db = criarDbFalso([
      [],
      [
        {
          lote_id: 'lote-bweb',
          arquivo: 'bweb.csv',
          ano_eleicao: null,
          nr_turno: null,
          sg_uf: null,
          status: 'concluido',
          iniciado_em: inicio,
          concluido_em: fim,
          duracao_ms: 2000,
          erro_codigo: null,
          erro_mensagem: null,
        },
      ],
    ]);

    const lote = await coletarStatus(db, { lote: '00000000-0000-0000-0000-000000000001' });

    expect(lote).toMatchObject({ origem: 'bweb', lote_id: 'lote-bweb', duracao_ms: 2000 });
    expect(db.restantes()).toBe(0);
  });

  it('recusa identificador fora do formato de UUID sem consultar o banco', async () => {
    const db = criarDbFalso([]);

    expect(await coletarStatus(db, { lote: 'nao-e-uuid' })).toBeNull();
    expect(db.restantes()).toBe(0);
  });
});
