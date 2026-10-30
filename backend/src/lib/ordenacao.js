import { sql } from 'kysely';
import { z } from 'zod';

export function ordenacaoSchema(chaves, sufixo = '') {
  return {
    [`ordem${sufixo}`]: z.enum(chaves).optional(),
    [`direcao${sufixo}`]: z.enum(['asc', 'desc']).optional(),
  };
}

export function lerOrdenacao(query, sufixo = '', padrao = null) {
  const ordem = query[`ordem${sufixo}`];
  if (!ordem) return padrao;
  return { ordem, direcao: query[`direcao${sufixo}`] ?? 'asc' };
}

export function ordenarSql(qb, colunas, ordenacao, desempate = []) {
  let resultado = qb.orderBy(sql`${colunas[ordenacao.ordem]} ${sql.raw(ordenacao.direcao)} nulls last`);
  for (const coluna of desempate) resultado = resultado.orderBy(coluna);
  return resultado;
}

const nulo = (valor) => valor === null || valor === undefined || Number.isNaN(valor);

function comparar(a, b) {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, 'pt-BR');
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

export function ordenarLista(lista, colunas, ordenacao) {
  if (!ordenacao) return lista;
  const fator = ordenacao.direcao === 'desc' ? -1 : 1;
  const chave = colunas[ordenacao.ordem];
  return lista
    .map((item) => [item, chave(item)])
    .sort(([, a], [, b]) => {
      if (nulo(a) || nulo(b)) return nulo(a) - nulo(b);
      return fator * comparar(a, b);
    })
    .map(([item]) => item);
}
