import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { FileMigrationProvider, Kysely, Migrator, NO_MIGRATIONS, PostgresDialect, sql } from 'kysely';
import { migracoesPendentes } from '../../src/db/migracoes.js';

const urlMigracao = process.env.TEST_DATABASE_MIGRATION_URL;
const diretorio = fileURLToPath(new URL('../fixtures/migrations', import.meta.url));
const schema = 'migracao_teste';

if (!urlMigracao) {
  throw new Error('TEST_DATABASE_MIGRATION_URL não definida');
}

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: urlMigracao,
      options: `-c timezone=UTC -c search_path=${schema}`,
    }),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({ fs, path, migrationFolder: diretorio }),
  migrationTableSchema: schema,
});

describe('checagem de migrações pendentes', () => {
  beforeAll(async () => {
    await sql`DROP SCHEMA IF EXISTS ${sql.id(schema)} CASCADE`.execute(db);
    await sql`CREATE SCHEMA ${sql.id(schema)}`.execute(db);
  });

  afterAll(async () => {
    await sql`DROP SCHEMA IF EXISTS ${sql.id(schema)} CASCADE`.execute(db);
    await db.destroy();
  });

  it('reporta migração pendente em banco sem a migração aplicada', async () => {
    const pendentes = await migracoesPendentes(db, diretorio);
    expect(pendentes).toContain('0001_teste');
  });

  it('não reporta pendências após migrateToLatest', async () => {
    const { error } = await migrator.migrateToLatest();
    expect(error).toBeUndefined();

    const pendentes = await migracoesPendentes(db, diretorio);
    expect(pendentes).toEqual([]);
  });
});
