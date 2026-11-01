import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import { describe, expect, it } from 'vitest';
import { baseSecaoCandidato } from '../../../src/modules/analise/estatisticas.js';

function bancoQueContaConsultas() {
  const consultas = [];
  const db = new Kysely({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (instancia) => new PostgresIntrospector(instancia),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    log: (evento) => {
      if (evento.level === 'query') consultas.push(evento.query.sql);
    },
  });
  return { db, consultas };
}

describe('baseSecaoCandidato', () => {
  it('compartilha a mesma consulta concorrente para o mesmo escopo', async () => {
    const { db, consultas } = bancoQueContaConsultas();
    const escopo = {
      eleicaoId: 'eleicao',
      cargo: 1,
      corte: { tipo: 'recebimento_intradiario', instante: new Date('2026-10-05T02:25:00.000Z') },
      escopo: { sgUf: 'AC' },
    };

    const primeira = baseSecaoCandidato(db, escopo);
    const segunda = baseSecaoCandidato(db, { ...escopo, corte: { ...escopo.corte, instante: new Date(escopo.corte.instante) } });

    const [resultadoPrimeiro, resultadoSegundo] = await Promise.all([primeira, segunda]);
    expect(consultas).toHaveLength(1);
    expect(resultadoPrimeiro).toBe(resultadoSegundo);
    expect([...resultadoPrimeiro]).toEqual([]);
  });

  it('nova consulta depois que a anterior termina', async () => {
    const { db, consultas } = bancoQueContaConsultas();
    const escopo = { eleicaoId: 'eleicao', cargo: 1, corte: { tipo: 'recebimento_diario', data: '2026-10-04' } };

    await baseSecaoCandidato(db, escopo);
    await baseSecaoCandidato(db, escopo);
    expect(consultas).toHaveLength(2);
  });
});
