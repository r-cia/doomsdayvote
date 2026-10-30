import { describe, expect, it } from 'vitest';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../../src/lib/ordenacao.js';

const colunas = { nome: (i) => i.nome, valor: (i) => i.valor };
const lista = [
  { id: 1, nome: 'Zé', valor: 2 },
  { id: 2, nome: 'Ágata', valor: null },
  { id: 3, nome: 'Bia', valor: 2 },
  { id: 4, nome: null, valor: 1 },
];

describe('ordenarLista', () => {
  it('sem ordenação mantém a lista original', () => {
    expect(ordenarLista(lista, colunas, null)).toBe(lista);
  });

  it('ordena números asc e desc com nulos por último e desempate estável', () => {
    expect(ordenarLista(lista, colunas, { ordem: 'valor', direcao: 'asc' }).map((i) => i.id)).toEqual([4, 1, 3, 2]);
    expect(ordenarLista(lista, colunas, { ordem: 'valor', direcao: 'desc' }).map((i) => i.id)).toEqual([1, 3, 4, 2]);
  });

  it('ordena textos em pt-BR com nulos por último', () => {
    expect(ordenarLista(lista, colunas, { ordem: 'nome', direcao: 'asc' }).map((i) => i.id)).toEqual([2, 3, 1, 4]);
    expect(ordenarLista(lista, colunas, { ordem: 'nome', direcao: 'desc' }).map((i) => i.id)).toEqual([1, 3, 2, 4]);
  });

  it('não altera a lista original', () => {
    ordenarLista(lista, colunas, { ordem: 'valor', direcao: 'desc' });
    expect(lista.map((i) => i.id)).toEqual([1, 2, 3, 4]);
  });
});

describe('lerOrdenacao e ordenacaoSchema', () => {
  it('lê ordem e direção com sufixo e assume asc', () => {
    expect(lerOrdenacao({ ordem_x: 'a' }, '_x')).toEqual({ ordem: 'a', direcao: 'asc' });
    expect(lerOrdenacao({ ordem: 'a', direcao: 'desc' })).toEqual({ ordem: 'a', direcao: 'desc' });
  });

  it('devolve o padrão quando não há ordem', () => {
    expect(lerOrdenacao({})).toBeNull();
    expect(lerOrdenacao({ direcao: 'desc' }, '', { ordem: 'p', direcao: 'desc' })).toEqual({ ordem: 'p', direcao: 'desc' });
  });

  it('o schema rejeita coluna fora da lista e direção inválida', () => {
    const campos = ordenacaoSchema(['a', 'b'], '_t');
    expect(campos.ordem_t.safeParse('a').success).toBe(true);
    expect(campos.ordem_t.safeParse('c').success).toBe(false);
    expect(campos.direcao_t.safeParse('up').success).toBe(false);
    expect(campos.direcao_t.safeParse(undefined).success).toBe(true);
  });
});
