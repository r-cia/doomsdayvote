import { describe, expect, it } from 'vitest';
import { loadApiEnv } from '../../src/env.js';

const ambienteValido = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '3000',
  LOG_LEVEL: 'info',
  DATABASE_URL: 'postgres://usuario:senha@localhost:5432/banco',
  SECTIONS_PAGE_SIZE_DEFAULT: '50',
  SECTIONS_PAGE_SIZE_MAX: '100',
};

describe('loadApiEnv', () => {
  it('lista todas as variáveis ausentes na mensagem de erro', () => {
    let mensagem = '';
    try {
      loadApiEnv({});
    } catch (erro) {
      mensagem = erro.message;
    }

    for (const nome of [
      'DATABASE_URL',
      'PORT',
      'SECTIONS_PAGE_SIZE_DEFAULT',
      'SECTIONS_PAGE_SIZE_MAX',
    ]) {
      expect(mensagem).toContain(nome);
    }
  });

  it('converte os valores para os tipos esperados', () => {
    const env = loadApiEnv(ambienteValido);

    expect(env.PORT).toBe(3000);
    expect(env.SECTIONS_PAGE_SIZE_MAX).toBe(100);
  });

  it('rejeita SECTIONS_PAGE_SIZE_MAX menor que o padrão', () => {
    expect(() =>
      loadApiEnv({ ...ambienteValido, SECTIONS_PAGE_SIZE_MAX: '10' }),
    ).toThrowError(/SECTIONS_PAGE_SIZE_MAX/);
  });

  it('rejeita PORT fora da faixa', () => {
    expect(() => loadApiEnv({ ...ambienteValido, PORT: '70000' })).toThrowError(/PORT/);
  });
});
