import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarCache } from '../../src/lib/cache.js';

const url = process.env.REDIS_URL;

describe.skipIf(!url)('cache Redis', () => {
  const cache = criarCache({ url });
  const rota = `teste-${Date.now()}`;
  const params = { election_id: 'a', cargo: 1 };

  beforeAll(async () => {
    for (let i = 0; i < 50; i += 1) {
      const { cache: estado } = await cache.obter(`${rota}-pronto`, params, 1, async () => 0);
      if (estado !== 'off') return;
      await new Promise((resolver) => setTimeout(resolver, 100));
    }
  });

  afterAll(async () => {
    await cache.fechar();
  });

  it('grava no Redis e serve a segunda leitura de lá', async () => {
    let chamadas = 0;
    const fn = async () => {
      chamadas += 1;
      return { valor: chamadas };
    };

    const primeira = await cache.obter(rota, params, 30, fn);
    const segunda = await cache.obter(rota, params, 30, fn);

    expect(primeira.cache).toBe('miss');
    expect(segunda.cache).toBe('hit');
    expect(segunda.valor).toEqual({ valor: 1 });
    expect(chamadas).toBe(1);
  });

  it('invalida as chaves anteriores', async () => {
    let chamadas = 0;
    const fn = async () => {
      chamadas += 1;
      return { valor: chamadas };
    };

    await cache.obter(`${rota}-invalida`, params, 30, fn);
    await cache.invalidar();
    const depois = await cache.obter(`${rota}-invalida`, params, 30, fn);

    expect(depois.cache).toBe('miss');
    expect(chamadas).toBe(2);
  });
});
