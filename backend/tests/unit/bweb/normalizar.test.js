import { describe, expect, it } from 'vitest';
import {
  combinarGeracao,
  normalizarData,
  normalizarDataHora,
  normalizarInteiro,
  normalizarTexto,
} from '../../../src/modules/importacao/bweb/normalizar.js';

describe('normalizarInteiro', () => {
  it('trata marcadores e negativos especiais como ausência', () => {
    expect(normalizarInteiro('-1')).toMatchObject({ valor: null, ausencia: 'NULO' });
    expect(normalizarInteiro('-3')).toMatchObject({ valor: null, ausencia: 'NE' });
    expect(normalizarInteiro('#NULO#')).toMatchObject({ valor: null, ausencia: 'NULO' });
    expect(normalizarInteiro('#NULO')).toMatchObject({ valor: null, ausencia: 'NULO' });
    expect(normalizarInteiro('#NE')).toMatchObject({ valor: null, ausencia: 'NE' });
  });

  it('mantém zero e sinaliza texto inválido', () => {
    expect(normalizarInteiro('0')).toMatchObject({ valor: 0, ausencia: null });
    expect(normalizarInteiro('12a')).toMatchObject({
      valor: null,
      erro: { codigo: 'TIPO_INVALIDO' },
    });
  });
});

describe('normalizarTexto', () => {
  it('remove espaços e trata marcadores', () => {
    expect(normalizarTexto('  Rio Branco  ')).toEqual({ valor: 'Rio Branco', ausencia: null });
    expect(normalizarTexto('#NULO#')).toEqual({ valor: null, ausencia: 'NULO' });
    expect(normalizarTexto('#NE')).toEqual({ valor: null, ausencia: 'NE' });
  });
});

describe('normalizarDataHora', () => {
  it('reconhece data e hora nos dois formatos', () => {
    expect(normalizarDataHora('04/10/2026 17:08:44')).toMatchObject({
      valor: { precisao: 'DATA_HORA', local: '2026-10-04 17:08:44' },
    });
    expect(normalizarDataHora('2022-10-02 17:30:00')).toMatchObject({
      valor: { precisao: 'DATA_HORA', local: '2022-10-02 17:30:00' },
    });
  });

  it('mantém data sem hora como DATA e nunca meia-noite', () => {
    expect(normalizarDataHora('05/10/2014')).toMatchObject({
      valor: { precisao: 'DATA', data: '2014-10-05', local: null },
    });
  });

  it('rejeita data inexistente e marcador sem erro', () => {
    expect(normalizarDataHora('31/02/2026')).toMatchObject({
      valor: { precisao: 'AUSENTE', local: null, data: null },
      erro: { codigo: 'FORMATO_DATA_INVALIDO' },
    });
    expect(normalizarDataHora('#NULO#')).toMatchObject({
      valor: { precisao: 'AUSENTE' },
      erro: null,
    });
  });
});

describe('normalizarData e combinarGeracao', () => {
  it('combina DT_GERACAO com HH_GERACAO', () => {
    const data = normalizarData('04/10/2026');
    expect(data.valor).toEqual({ precisao: 'DATA', local: null, data: '2026-10-04' });
    expect(combinarGeracao(data.valor, '17:08:44')).toEqual({
      precisao: 'DATA_HORA',
      local: '2026-10-04 17:08:44',
      data: null,
    });
  });
});
