import { validar } from '../lib/validar.js';
import { registrarAnalise } from './analise.js';
import { registrarApuracao } from './apuracao.js';
import { registrarBiometria } from './biometria.js';
import { registrarEncerramento } from './encerramento.js';
import { registrarRelatorio } from './relatorio.js';
import { registrarSecoes } from './secoes.js';

export async function registrarRotas(app) {
  const db = app.deps.db;
  const cache = app.deps.cache ?? {
    obter: async (_rota, _params, _ttl, fn) => ({ valor: await fn(), cache: 'off' }),
  };

  const cacheado = (rota, ttl, schema, fn) => async (req, reply) => {
    const query = validar(schema, { ...req.params, ...req.query });
    const { valor, cache: estado } = await cache.obter(rota, query, ttl, () => fn(query, req));
    reply.header('x-cache', estado);
    return valor;
  };

  const contexto = { app, db, cache, cacheado };
  registrarApuracao(contexto);
  registrarAnalise(contexto);
  registrarBiometria(contexto);
  registrarEncerramento(contexto);
  registrarRelatorio(contexto);
  registrarSecoes(contexto);
}
