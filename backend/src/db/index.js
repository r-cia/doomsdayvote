import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

pg.types.setTypeParser(1082, (valor) => valor);
pg.types.setTypeParser(20, (valor) => Number(valor));

// Máquina com 32 GB de RAM: pool maior e work_mem elevado para sorts/aggregates pesados.
export function criarDb({ connectionString, readOnly = false }) {
  const options = readOnly
    ? '-c timezone=UTC -c default_transaction_read_only=on -c work_mem=256MB -c maintenance_work_mem=1GB'
    : '-c timezone=UTC -c work_mem=256MB -c maintenance_work_mem=1GB';

  const pool = new pg.Pool({
    connectionString,
    options,
    max: 40,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 60000,
    allowExitOnIdle: false,
  });

  const db = new Kysely({
    dialect: new PostgresDialect({ pool }),
  });

  Object.defineProperty(db, 'pool', { value: pool });

  return db;
}
