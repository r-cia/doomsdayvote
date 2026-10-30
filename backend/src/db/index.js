import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

pg.types.setTypeParser(1082, (valor) => valor);
pg.types.setTypeParser(20, (valor) => Number(valor));

export function criarDb({
  connectionString,
  readOnly = false,
  statementTimeout = 60000,
  poolMax = 20,
  workMemMb = 64,
}) {
  // statement_timeout precisa ir em `options`: o pg descarta valor 0 como falsy.
  const options = [
    '-c timezone=UTC',
    `-c work_mem=${workMemMb}MB`,
    `-c statement_timeout=${statementTimeout}`,
    ...(readOnly ? ['-c default_transaction_read_only=on'] : []),
  ].join(' ');

  const pool = new pg.Pool({
    connectionString,
    options,
    max: poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: false,
  });

  const db = new Kysely({
    dialect: new PostgresDialect({ pool }),
  });

  Object.defineProperty(db, 'pool', { value: pool });

  return db;
}
