import pino from 'pino';

export function criarLogger({ level = 'info' } = {}) {
  return pino({
    level,
    redact: [
      '*.password',
      '*.connectionString',
      'DATABASE_URL',
      'DATABASE_MIGRATION_URL',
      'TEST_DATABASE_URL',
      'TEST_DATABASE_MIGRATION_URL',
    ],
  });
}
