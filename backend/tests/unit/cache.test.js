import { describe, expect, it, vi } from 'vitest';
import { criarCache } from '../../src/lib/cache.js';

class RedisFalso {
  constructor() {
    this.dados = new Map();
    this.gravacoes = [];
    this.falhar = false;
  }

  async get(chave) {
    if (this.falhar) throw new Error('redis fora');
    return this.dados.has(chave) ? this.dados.get(chave) : null;
  }

  async set(chave, valor, modo, ttl) {
    if (this.falhar) throw new Error('redis fora');
    this.dados.set(chave, valor);
    this.gravacoes.push({ chave, ttl, modo });
  }

  async incr(chave) {
    if (this.falhar) throw new Error('redis fora');
    const proximo = Number(this.dados.get(chave) ?? 0) + 1;
    this.dados.set(chave, String(proximo));
    return proximo;
  }

  async quit() {}
  disconnect() {}
}

const params = { election_id: 'a', cargo: 1 };

describe('cache', () => {
  it('guarda o resultado na primeira chamada e serve do Redis na segunda', async () => {
    const cliente = new RedisFalso();
    const cache = criarCache({ cliente });
    const fn = vi.fn().mockResolvedValue({ valor: 42 });

    const primeira = await cache.obter('summary', params, 60, fn);
    const segunda = await cache.obter('summary', params, 60, fn);

    expect(primeira).toEqual({ valor: { valor: 42 }, cache: 'miss' });
    expect(segunda).toEqual({ valor: { valor: 42 }, cache: 'hit' });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cliente.gravacoes[0].ttl).toBe(60);
    expect(cliente.gravacoes[0].modo).toBe('EX');
  });

  it('separa recortes diferentes em chaves diferentes', async () => {
    const cliente = new RedisFalso();
    const cache = criarCache({ cliente });
    const fn = vi.fn(async (valor) => ({ valor }));

    await cache.obter('summary', { ...params, uf: 'SP' }, 60, () => fn('SP'));
    await cache.obter('summary', { ...params, uf: 'RJ' }, 60, () => fn('RJ'));

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('segue para o banco quando o Redis falha', async () => {
    const cliente = new RedisFalso();
    cliente.falhar = true;
    const cache = criarCache({ cliente });
    const fn = vi.fn().mockResolvedValue({ valor: 7 });

    const resultado = await cache.obter('summary', params, 60, fn);

    expect(resultado).toEqual({ valor: { valor: 7 }, cache: 'off' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('junta chamadas simultâneas em uma única consulta', async () => {
    const cliente = new RedisFalso();
    const cache = criarCache({ cliente });
    const fn = vi.fn(async () => {
      await new Promise((resolver) => setTimeout(resolver, 20));
      return { valor: 'caro' };
    });

    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => cache.obter('anomalies', params, 600, fn)),
    );

    expect(fn).toHaveBeenCalledTimes(1);
    expect(respostas.every((resposta) => resposta.valor.valor === 'caro')).toBe(true);
  });

  it('não serve cache antigo depois de invalidar', async () => {
    const cliente = new RedisFalso();
    const cache = criarCache({ cliente });
    const fn = vi.fn().mockResolvedValue({ valor: 1 });

    await cache.obter('summary', params, 60, fn);
    await cache.invalidar();
    const depois = await cache.obter('summary', params, 60, fn);

    expect(depois.cache).toBe('miss');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('não cacheia erro', async () => {
    const cliente = new RedisFalso();
    const cache = criarCache({ cliente });
    const fn = vi.fn().mockRejectedValue(new Error('consulta falhou'));

    await expect(cache.obter('summary', params, 60, fn)).rejects.toThrow('consulta falhou');

    expect(cliente.gravacoes).toHaveLength(0);
  });

  it('funciona sem Redis configurado', async () => {
    const cache = criarCache({});
    const fn = vi.fn().mockResolvedValue({ valor: 1 });

    const resultado = await cache.obter('summary', params, 60, fn);

    expect(resultado).toEqual({ valor: { valor: 1 }, cache: 'off' });
    expect(cache.ligado).toBe(false);
  });
});
