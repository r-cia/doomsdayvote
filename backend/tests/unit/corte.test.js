import { describe, expect, it } from 'vitest';
import { corteResposta, resolverCorte } from '../../src/modules/apuracao/corte.js';

function erroDe(query) {
  try {
    resolverCorte(query);
  } catch (erro) {
    return erro;
  }
  throw new Error('deveria ter lançado');
}

describe('resolverCorte', () => {
  it('sem parâmetros é final', () => {
    expect(resolverCorte({})).toEqual({ tipo: 'final' });
  });

  it('as_of com offset vira corte intradiário', () => {
    const corte = resolverCorte({ as_of: '2026-10-04T18:30:00-03:00' });
    expect(corte.tipo).toBe('recebimento_intradiario');
    expect(corte.instante.toISOString()).toBe('2026-10-04T21:30:00.000Z');
  });

  it('as_of_date vira corte diário', () => {
    expect(resolverCorte({ as_of_date: '2014-10-05' })).toEqual({
      tipo: 'recebimento_diario',
      data: '2014-10-05',
    });
  });

  it('rejeita as_of sem offset, as_of com as_of_date e data inválida', () => {
    expect(erroDe({ as_of: '2026-10-04T18:30:00' }).code).toBe('VALIDATION');
    expect(erroDe({ as_of: '2026-10-04T18:30:00Z', as_of_date: '2026-10-04' }).code).toBe('VALIDATION');
    expect(erroDe({ as_of_date: '2026-02-30' }).code).toBe('VALIDATION');
  });

  it('monta o contrato de resposta do corte', () => {
    const corte = resolverCorte({ as_of: '2026-10-04T18:30:00-03:00' });
    expect(corteResposta(corte)).toEqual({
      tipo: 'recebimento_intradiario',
      as_of: '2026-10-04T21:30:00.000Z',
      as_of_date: null,
      fuso_exibicao: 'America/Sao_Paulo',
    });
  });
});
