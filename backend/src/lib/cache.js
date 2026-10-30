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

    try {
      const versao = (await cliente.get(CHAVE_VERSAO)) ?? '0';
      chave = `dv:v${versao}:${rota}:${hash(params)}`;

      const bruto = await cliente.get(chave);
      if (bruto !== null) return { valor: JSON.parse(bruto), cache: 'hit' };
    } catch {
      return { valor: await fn(), cache: 'off' };
    }

    const pendente = emVoo.get(chave);
    if (pendente) return { valor: await pendente, cache: 'miss' };

    const execucao = (async () => {
      const valor = await fn();
      try {
        await cliente.set(chave, JSON.stringify(valor), 'EX', ttl);
      } catch {
        logger?.debug({ chave }, 'cache_nao_gravado');
      }
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
