import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

pg.types.setTypeParser(1082, (valor) => valor);
pg.types.setTypeParser(20, (valor) => Number(valor));

export function criarDb({ connectionString, readOnly = false }) {
  const options = readOnly
    ? '-c timezone=UTC -c default_transaction_read_only=on'
    : '-c timezone=UTC';

  const pool = new pg.Pool({ connectionString, options });

  return new Kysely({
    dialect: new PostgresDialect({ pool }),
  });
}
