import { describe, expect, it } from 'vitest';
import { baseSecaoCandidato } from '../../../src/modules/analise/estatisticas.js';

describe('baseSecaoCandidato', () => {
  it('compartilha a mesma consulta concorrente para o mesmo escopo', async () => {
    let resolver;
    let execucoes = 0;
    const resultado = [{ secao_id: 'secao', nr_votavel: 13, votos: '10' }];
    const consultaPendente = new Promise((resolve) => {
      resolver = resolve;
    });
    const qb = {
      innerJoin() {
        return this;
      },
      leftJoin(_tabela, configurar) {
        configurar({ onRef() { return this; } });
        return this;
      },
      where() {
        return this;
      },
      select() {
        return this;
      },
      groupBy() {
        return this;
      },
      execute() {
        execucoes += 1;
        return consultaPendente;
      },
    };
    const db = { selectFrom: () => qb };
    const escopo = {
      eleicaoId: 'eleicao',
      cargo: 1,
      corte: { tipo: 'recebimento_intradiario', instante: new Date('2026-10-05T02:25:00.000Z') },
      escopo: { sgUf: 'AC' },
    };

    const primeira = baseSecaoCandidato(db, escopo);
    const segunda = baseSecaoCandidato(db, { ...escopo, corte: { ...escopo.corte, instante: new Date(escopo.corte.instante) } });
    resolver(resultado);

    const [resultadoPrimeiro, resultadoSegundo] = await Promise.all([primeira, segunda]);
    expect(execucoes).toBe(1);
    expect(resultadoPrimeiro).toBe(resultadoSegundo);
    expect(resultadoPrimeiro).toEqual(resultado);
  });
});
