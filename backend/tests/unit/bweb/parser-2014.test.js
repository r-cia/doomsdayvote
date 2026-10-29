import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { lerArquivoBweb } from '../../../src/modules/importacao/bweb/ler-arquivo.js';
import { interpretarNomeArquivo2014 } from '../../../src/modules/importacao/bweb/nome-arquivo-2014.js';
import { parsearRegistro2014 } from '../../../src/modules/importacao/bweb/parser-2014.js';

function fixture(nome) {
  return fileURLToPath(new URL(`../../fixtures/bweb/${nome}`, import.meta.url));
}

async function coletar(registros) {
  const lista = [];
  for await (const registro of registros) lista.push(registro);
  return lista;
}

const LINHA_2014 = [
  '14/10/2014',
  '13:16:00',
  '143',
  '157',
  'AC',
  '1',
  'Presidente',
  '1',
  '2',
  '3',
  '13',
  'PT',
  '1392',
  'RIO BRANCO',
  '14/10/2014',
  '100',
  '10',
  '90',
  '0',
  '1',
  'Apurada',
  '13',
  'Candidato',
  '50',
  '1',
  '123',
  'c1',
  'c2',
  'c3',
  'c4',
  'Presidente 1',
];

describe('parser BWEB_2014_31', () => {
  it('mapeia as colunas posicionais 15, 17, 18, 19 e 20', () => {
    const derivados = interpretarNomeArquivo2014('bweb_1t_AC_14102014131600.txt');
    const registro = parsearRegistro2014(LINHA_2014, 2, derivados);

    expect(registro.valores.DT_BU_RECEBIDO).toMatchObject({
      precisao: 'DATA',
      data: '2014-10-14',
      local: null,
    });
    expect(registro.valores.QT_ABSTENCOES).toBe(10);
    expect(registro.valores.QT_COMPARECIMENTO).toBe(90);
    expect(registro.valores.CD_TIPO_ELEICAO).toBe(0);
    expect(registro.valores.CD_TIPO_URNA).toBe(1);
    expect(registro.valores.ANO_ELEICAO).toBe(2014);
    expect(registro.valores.NR_TURNO).toBe(1);
    expect(registro.bruto.ANO_ELEICAO).toBeUndefined();
    expect(registro.bruto.NR_TURNO).toBeUndefined();
  });

  it('sinaliza linha com largura diferente de 31', () => {
    const derivados = interpretarNomeArquivo2014('bweb_1t_AC_14102014131600.txt');
    const registro = parsearRegistro2014(LINHA_2014.slice(0, 30), 2, derivados);

    expect(registro.erros).toEqual(
      expect.arrayContaining([expect.objectContaining({ codigo: 'LARGURA_INVALIDA' })]),
    );
  });

  it('lê 5.565 registros de AC 1º turno sem horário fictício', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb_1t_AC_14102014131600.txt'));
    const registros = await coletar(arquivo.registros);

    expect(arquivo.leiaute).toBe('BWEB_2014_31');
    expect(arquivo.metadadosDerivados).toMatchObject({
      campos: ['ANO_ELEICAO', 'NR_TURNO'],
      origem: 'nome_arquivo',
      valores: { ANO_ELEICAO: 2014, NR_TURNO: 1 },
    });
    expect(registros).toHaveLength(5565);

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

    const inconsistentes = registros.filter(
      (r) =>
        r.valores.QT_APTOS !== null &&
        r.valores.QT_COMPARECIMENTO !== null &&
        r.valores.QT_ABSTENCOES !== null &&
        r.valores.QT_APTOS !== r.valores.QT_COMPARECIMENTO + r.valores.QT_ABSTENCOES,
    );
    expect(inconsistentes.map((r) => r.nrLinha)).toEqual([]);
  });

  it('lê o subset de AC 2º turno', async () => {
    const arquivo = await lerArquivoBweb(fixture('bweb_2t_AC_28102014114450.txt'));
    const registros = await coletar(arquivo.registros);

    expect(registros).toHaveLength(300);
    for (const registro of registros) {
      expect(registro.valores.ANO_ELEICAO).toBe(2014);
      expect(registro.valores.NR_TURNO).toBe(2);
      expect(registro.valores.SG_UF).toBe('AC');
    }
  });
});
