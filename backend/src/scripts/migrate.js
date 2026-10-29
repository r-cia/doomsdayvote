import * as fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { FileMigrationProvider, Kysely, Migrator, NO_MIGRATION, PostgresDialect } from 'kysely';
import { loadMigrateEnv } from '../env.js';
import { DIRETORIO_MIGRACOES } from '../db/migracoes.js';

async function main() {
  let env;
  try {
    env = loadMigrateEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const reset = process.argv.includes('--reset');
  if (reset && env.NODE_ENV === 'production') {
    console.error('migrate:reset não é permitido em production');
    process.exit(1);
  }

  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: env.DATABASE_MIGRATION_URL,
        options: '-c timezone=UTC',
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: DIRETORIO_MIGRACOES,
    }),
  });

  try {
    if (reset) {
      const descida = await migrator.migrateTo(NO_MIGRATION);
      if (descida.error) throw descida.error;
    }

    const { error, results } = await migrator.migrateToLatest();
    if (error) throw error;

    for (const resultado of results ?? []) {
      console.log(`${resultado.direction} ${resultado.migrationName} ${resultado.status}`);
    }
  } catch (erro) {
    console.error(erro.message);
    await db.destroy();
    process.exit(1);
  }

  await db.destroy();
}

main();
