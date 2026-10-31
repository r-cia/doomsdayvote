import { describe, expect, it } from 'vitest';
import { loadApiEnv, loadWorkerEnv } from '../../src/env.js';

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

describe('loadWorkerEnv', () => {
  const ambienteValido = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://usuario:senha@localhost:5432/banco',
    DATABASE_MIGRATION_URL: 'postgres://dono:senha@localhost:5432/banco',
    BWEB_INPUT_DIR: '/dados/entrada',
    BWEB_STORAGE_DIR: '/dados/storage',
  };

  it('desativa o filtro por padrão e converte a flag para booleano', () => {
    expect(loadWorkerEnv(ambienteValido).BWEB_SKIP_CARGOS_LEGISLATIVOS).toBe(false);
    expect(
      loadWorkerEnv({ ...ambienteValido, BWEB_SKIP_CARGOS_LEGISLATIVOS: 'true' })
        .BWEB_SKIP_CARGOS_LEGISLATIVOS,
    ).toBe(true);
    expect(
      loadWorkerEnv({ ...ambienteValido, BWEB_SKIP_CARGOS_LEGISLATIVOS: 'false' })
        .BWEB_SKIP_CARGOS_LEGISLATIVOS,
    ).toBe(false);
  });

  it('rejeita valores inválidos para a flag', () => {
    expect(() =>
      loadWorkerEnv({ ...ambienteValido, BWEB_SKIP_CARGOS_LEGISLATIVOS: 'yes' }),
    ).toThrowError(/BWEB_SKIP_CARGOS_LEGISLATIVOS/);
  });
});
