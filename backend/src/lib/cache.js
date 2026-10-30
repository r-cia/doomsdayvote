import { createHash } from 'node:crypto';
import Redis from 'ioredis';

const CHAVE_VERSAO = 'dv:versao';

function hash(params) {
  const estavel = JSON.stringify(
    Object.keys(params)
      .sort()
      .map((chave) => [chave, params[chave] ?? null]),
  );

  return createHash('sha1').update(estavel).digest('hex').slice(0, 16);
}

export function criarCache({ url, logger, cliente: fornecido } = {}) {
  const emVoo = new Map();

  if (!url && !fornecido) {
    return {
      ligado: false,
      obter: async (_rota, _params, _ttl, fn) => ({ valor: await fn(), cache: 'off' }),
      invalidar: async () => {},
      fechar: async () => {},
    };
  }

  const cliente =
    fornecido ??
    new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      keepAlive: 30000,
      enableReadyCheck: true,
      retryStrategy: (tentativas) => Math.min(tentativas * 1000, 5000),
    });

  if (!fornecido) {
    let avisou = false;
    cliente.on('error', (erro) => {
      if (avisou) return;
      avisou = true;
      logger?.warn({ err: erro }, 'redis_indisponivel');
    });
    cliente.on('ready', () => {
      avisou = false;
    });
    cliente.connect().catch(() => {});
  }

  async function obter(rota, params, ttl, fn) {
    let chave;
    const inicio = performance.now();

    try {
      const versao = (await cliente.get(CHAVE_VERSAO)) ?? '0';
      chave = `dv:v${versao}:${rota}:${hash(params)}`;

      const bruto = await cliente.get(chave);
      if (bruto !== null) {
        const duracao = Number((performance.now() - inicio).toFixed(2));
        logger?.info({ rota, cache: 'hit', duracao_ms: duracao }, 'cache_obter');
        return { valor: JSON.parse(bruto), cache: 'hit' };
      }
    } catch {
      const chaveLocal = `off:${rota}:${hash(params)}`;
      const pendente = emVoo.get(chaveLocal);
      if (pendente) {
        const valor = await pendente;
        logger?.info(
          { rota, cache: 'off', duracao_ms: Number((performance.now() - inicio).toFixed(2)), dedup: true },
          'cache_obter',
        );
        return { valor, cache: 'off' };
      }

      const execucao = Promise.resolve().then(fn);
      emVoo.set(chaveLocal, execucao);
      let valor;
      try {
        valor = await execucao;
      } finally {
        if (emVoo.get(chaveLocal) === execucao) emVoo.delete(chaveLocal);
      }
      const duracao = Number((performance.now() - inicio).toFixed(2));
      logger?.info({ rota, cache: 'off', duracao_ms: duracao }, 'cache_obter');
      return { valor, cache: 'off' };
    }

    const pendente = emVoo.get(chave);
    if (pendente) {
      const valor = await pendente;
      const duracao = Number((performance.now() - inicio).toFixed(2));
      logger?.info({ rota, cache: 'miss', duracao_ms: duracao, dedup: true }, 'cache_obter');
      return { valor, cache: 'miss' };
    }

    const inicioFn = performance.now();
    const execucao = (async () => {
      const valor = await fn();
      const duracaoFn = Number((performance.now() - inicioFn).toFixed(2));
      try {
        await cliente.set(chave, JSON.stringify(valor), 'EX', ttl);
      } catch {
        logger?.debug({ chave }, 'cache_nao_gravado');
      }
      logger?.info({ rota, cache: 'miss', duracao_ms: Number((performance.now() - inicio).toFixed(2)), duracao_fn_ms: duracaoFn }, 'cache_obter');
      return valor;
    })();

    emVoo.set(chave, execucao);

    try {
      return { valor: await execucao, cache: 'miss' };
    } finally {
      emVoo.delete(chave);
    }
  }

  async function invalidar() {
    await cliente.incr(CHAVE_VERSAO);
  }

  async function fechar() {
    try {
      await cliente.quit();
    } catch {
      cliente.disconnect();
    }
  }

  return { ligado: true, obter, invalidar, fechar };
}
