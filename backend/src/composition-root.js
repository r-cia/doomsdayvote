import { criarDb } from './db/index.js';
import { criarLogger } from './lib/logger.js';

export function criarDependencias(env) {
  const db = criarDb({ connectionString: env.DATABASE_URL, readOnly: true });
  const logger = criarLogger({ level: env.LOG_LEVEL });

  return { db, logger };
}
