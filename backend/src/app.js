import Fastify from 'fastify';
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

export function buildApp({ deps = {}, config = {}, rotas }) {
  const app = Fastify({
    ...(deps.logger ? { loggerInstance: deps.logger } : { logger: false }),
  });

  app.decorate('deps', deps);
  app.decorate('config', config);

  app.addHook('onResponse', async (req, reply) => {
    req.log.info(
      {
        rota: req.routerPath ?? req.url,
        metodo: req.method,
        status: reply.statusCode,
        duracao_ms: Number(reply.elapsedTime.toFixed(2)),
        bytes: Number(reply.getHeader('content-length') || 0),
        cache: reply.getHeader('x-cache') ?? null,
      },
      'http_resposta',
    );
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
