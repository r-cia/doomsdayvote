import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { FileMigrationProvider, Kysely, Migrator, NO_MIGRATION, PostgresDialect, sql } from 'kysely';
import { migracoesPendentes } from '../../src/db/migracoes.js';

const urlMigracao = process.env.TEST_DATABASE_MIGRATION_URL;
const diretorio = fileURLToPath(new URL('../fixtures/migrations', import.meta.url));

if (!urlMigracao) {
  throw new Error('TEST_DATABASE_MIGRATION_URL não definida');
}

function criarConexao() {
  return new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: urlMigracao, options: '-c timezone=UTC' }),
    }),
  });
}

function criarMigrador(db) {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({ fs, path, migrationFolder: diretorio }),
  });
}

describe('checagem de migrações pendentes', () => {
  const db = criarConexao();
  const migrator = criarMigrador(db);

  beforeAll(async () => {
    const tabela = await sql`SELECT to_regclass('public.kysely_migration') AS tabela`.execute(db);
    if (tabela.rows[0]?.tabela) {
      await sql`DELETE FROM kysely_migration WHERE name = '0001_teste'`.execute(db);
    }
    await sql`DROP TABLE IF EXISTS tabela_teste_migracao`.execute(db);
  });

  afterAll(async () => {
    await migrator.migrateTo(NO_MIGRATION);
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
