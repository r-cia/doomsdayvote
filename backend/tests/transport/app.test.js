import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../../src/app.js';
import { validar } from '../../src/lib/validar.js';

const nodeEnvOriginal = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = nodeEnvOriginal;
});

describe('buildApp', () => {
  it('responde 404 no contrato de erro', async () => {
    const app = buildApp({});
    const resposta = await app.inject({ method: 'GET', url: '/api/nao-existe' });

    expect(resposta.statusCode).toBe(404);
    expect(resposta.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada' },
    });
  });

  it('não vaza detalhe interno em produção', async () => {
    process.env.NODE_ENV = 'production';
    const app = buildApp({
      rotas: (escopo) => {
        escopo.get('/api/boom', async () => {
          throw new Error('boom');
        });
      },
    });

    const resposta = await app.inject({ method: 'GET', url: '/api/boom' });
    const corpo = resposta.body;

    expect(resposta.statusCode).toBe(500);
    expect(resposta.json().error.code).toBe('INTERNAL');
    expect(resposta.json().error.message).toBe('Erro interno');
    expect(corpo).not.toContain('boom');
    expect(corpo).not.toContain('at ');
  });

  it('responde 400 VALIDATION com o caminho do campo', async () => {
    const app = buildApp({
      rotas: (escopo) => {
        const schema = z.object({ as_of: z.string().datetime() });
        escopo.get('/api/validar', async (req) => validar(schema, req.query));
      },
    });

    const resposta = await app.inject({ method: 'GET', url: '/api/validar?as_of=ontem' });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().error.code).toBe('VALIDATION');
    expect(resposta.json().error.details[0].path).toBe('as_of');
  });
});
