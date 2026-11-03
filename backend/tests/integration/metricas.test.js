import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { parsearLogJez } from '../../src/modules/totalizacao/log.js';
import {
  registrarEleitores,
  registrarIncidentes,
} from '../../src/modules/totalizacao/metricas.js';
import { CENARIO, gerarLogJez } from '../helpers/dados-sinteticos.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const eventos = parsearLogJez(gerarLogJez());

const db = criarDb({ connectionString: url });

const UF = 'ZZ';
const MUNICIPIO = 4242;
const NOME_ARQUIVO = 'metricas-sintetico.jez';
const SHA256 = 'd'.repeat(64);

async function limpar() {
  await sql`
    DELETE FROM totalizacao_incidente
    WHERE totalizacao_secao_id IN (
      SELECT id FROM totalizacao_secao WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
    )
  `.execute(db);
  await sql`
    DELETE FROM totalizacao_eleitor
    WHERE totalizacao_secao_id IN (
      SELECT id FROM totalizacao_secao WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
    )
  `.execute(db);
  await sql`
    DELETE FROM totalizacao_secao WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
  `.execute(db);
  await sql`DELETE FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO}`.execute(db);
  await sql`DELETE FROM localidade WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}`.execute(db);
}

async function criarSecao() {
  await db
    .insertInto('localidade')
    .values({ sg_uf: UF, cd_municipio_tse: MUNICIPIO, nm_municipio: 'SEÇÃO MÉTRICAS' })
    .execute();

  const lote = await db
    .insertInto('totalizacao_lote')
    .values({
      nome_arquivo: NOME_ARQUIVO,
      sg_uf: UF,
      ano_eleicao: 2026,
      nr_turno: 1,
      sha256: SHA256,
      status: 'concluido',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return db
    .insertInto('totalizacao_secao')
    .values({
      lote_id: lote.id,
      ano_eleicao: 2026,
      nr_turno: 1,
      sg_uf: UF,
      cd_municipio_tse: MUNICIPIO,
      nr_zona: 305,
      nr_secao: 241,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
}

describe('persistência das métricas do log', () => {
  beforeAll(async () => {
    await limpar();
  });

  afterAll(async () => {
    await limpar();
    await db.destroy();
  });

  it('grava um eleitor por par habilitado/computado e os incidentes da sessão', async () => {
    const secao = await criarSecao();

    await registrarEleitores(db, secao.id, eventos);
    await registrarIncidentes(db, secao.id, eventos);

    const eleitores = await sql`
      SELECT count(*)::int AS total FROM totalizacao_eleitor
      WHERE totalizacao_secao_id = ${secao.id}
    `.execute(db);
    expect(eleitores.rows[0].total).toBe(CENARIO.comparecimento);

    const incidentes = await sql`
      SELECT count(*)::int AS total FROM totalizacao_incidente
      WHERE totalizacao_secao_id = ${secao.id}
    `.execute(db);
    expect(incidentes.rows[0].total).toBe(1);

    const eleitor = await db
      .selectFrom('totalizacao_eleitor')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .orderBy('habilitado_em')
      .executeTakeFirstOrThrow();

    expect(eleitor.tp_habilitacao).toBe(2);
    expect(eleitor.correcao).toBe(false);
    expect(eleitor.duracao_ms).toBe(30000);
    expect(eleitor.habilitado_em).toBeInstanceOf(Date);
    expect(eleitor.computado_em.getTime() - eleitor.habilitado_em.getTime()).toBe(
      eleitor.duracao_ms,
    );

    const incidente = await db
      .selectFrom('totalizacao_incidente')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .orderBy('dt_incidente')
      .executeTakeFirstOrThrow();

    expect(incidente.nivel).toBe('ALERTA');
    expect(incidente.texto_original.length).toBeGreaterThan(0);
    expect(incidente.dt_incidente).toBeInstanceOf(Date);
  }, 120000);
});
