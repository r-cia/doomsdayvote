import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';

const urlApp = process.env.TEST_DATABASE_URL;

if (!urlApp) {
  throw new Error('TEST_DATABASE_URL não definida');
}

describe('papéis e sessão do banco', () => {
  const cliente = new pg.Client({ connectionString: urlApp });

  afterAll(async () => {
    if (cliente._ending) return;
    await cliente.end();
  });

  it('doomsday_app não consegue DDL', async () => {
    await cliente.connect();

    await expect(cliente.query('CREATE TABLE tabela_proibida (x int)')).rejects.toMatchObject({
      code: '42501',
    });
  });

  it('conexão read-only rejeita escrita', async () => {
    const db = criarDb({ connectionString: urlApp, readOnly: true });

    await expect(sql`CREATE TEMP TABLE tabela_temp (x int)`.execute(db)).rejects.toMatchObject({
      code: '25006',
    });

    await db.destroy();
  });

  it('sessão usa UTC e date chega como string', async () => {
    const db = criarDb({ connectionString: urlApp, readOnly: true });

    const fuso = await sql`SHOW timezone`.execute(db);
    const data = await sql`SELECT '2026-10-04'::date AS d`.execute(db);

    expect(fuso.rows[0].TimeZone).toBe('UTC');
    expect(data.rows[0].d).toBe('2026-10-04');
    expect(typeof data.rows[0].d).toBe('string');

    await db.destroy();
  });
});
