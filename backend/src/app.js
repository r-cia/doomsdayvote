import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { AppError } from './lib/erros.js';
import { isProduction } from './lib/ambiente.js';

function detalhesZod(erro) {
  return erro.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

function detalhesFastify(validacao) {
  return validacao.map((item) => ({
    path: item.instancePath.replace(/^\//, '').replace(/\//g, '.') || item.params?.missingProperty || '',
    message: item.message,
  }));
}

export function buildApp({ deps = {}, config, rotas }) {
  const app = Fastify({
    logger: deps.logger ?? false,
    trustProxy: config.TRUST_PROXY,
  });

  app.decorate('deps', deps);

  app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: () => new AppError('RATE_LIMITED', 429, 'Muitas requisições'),
  });

  app.register(async (escopo) => {
    if (rotas) await rotas(escopo);
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Rota não encontrada',
      },
    });
  });

  app.setErrorHandler((erro, req, reply) => {
    if (erro instanceof AppError) {
      const corpo = {
        error: {
          code: erro.code,
          message: erro.message,
        },
      };
      if (erro.details !== undefined) corpo.error.details = erro.details;
      return reply.code(erro.statusCode).send(corpo);
    }

    if (erro instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION',
          message: 'Parâmetro inválido',
          details: detalhesZod(erro),
        },
      });
    }

    if (erro.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION',
          message: 'Parâmetro inválido',
          details: detalhesFastify(erro.validation),
        },
      });
    }

    req.log.error({ err: erro }, 'erro_nao_tratado');

    return reply.code(500).send({
      error: {
        code: 'INTERNAL',
        message: isProduction() ? 'Erro interno' : erro.message || 'Erro interno',
      },
    });
  });

  return app;
}
