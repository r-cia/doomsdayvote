import { criarDb } from './db/index.js';
import { criarCache } from './lib/cache.js';
import { criarLogger } from './lib/logger.js';

export function criarDependencias(env) {
  const db = criarDb({ connectionString: env.DATABASE_URL, readOnly: true });
  const logger = criarLogger({ level: env.LOG_LEVEL });
  const cache = criarCache({ url: env.REDIS_URL, logger });

  return { db, logger, cache };
}
