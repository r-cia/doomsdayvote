import * as fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import { DIRETORIO_MIGRACOES } from '../../src/db/migracoes.js';

export default async function () {
  const url = process.env.TEST_DATABASE_MIGRATION_URL;

  if (!url) {
    throw new Error(
      'TEST_DATABASE_MIGRATION_URL não definida: a suíte de integração precisa dessa URL para aplicar as migrações',
    );
  }

  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: url, options: '-c timezone=UTC' }),
    }),
  });

  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({ fs, path, migrationFolder: DIRETORIO_MIGRACOES }),
    });

    const { error } = await migrator.migrateToLatest();
    if (error) throw error;
  } finally {
    await db.destroy();
  }
}
