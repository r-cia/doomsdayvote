import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/lib/erros.js';

describe('AppError', () => {
  it('preserva código, status e detalhes', () => {
    const erro = new AppError('VALIDATION', 400, 'Parâmetro inválido', [
      { path: 'as_of', message: 'obrigatório' },
    ]);

    expect(erro).toBeInstanceOf(Error);
    expect(erro.code).toBe('VALIDATION');
    expect(erro.statusCode).toBe(400);
    expect(erro.message).toBe('Parâmetro inválido');
    expect(erro.details).toEqual([{ path: 'as_of', message: 'obrigatório' }]);
  });
});
