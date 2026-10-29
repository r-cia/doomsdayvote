import { z } from 'zod';

const booleano = z.preprocess((valor) => {
  if (valor === undefined) return false;
  if (typeof valor === 'boolean') return valor;
  if (valor === 'true' || valor === '1') return true;
  if (valor === 'false' || valor === '0') return false;
  return valor;
}, z.boolean());

const nodeEnv = z.enum(['development', 'test', 'production']).default('development');
const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info');

const apiSchema = z
  .object({
    NODE_ENV: nodeEnv,
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535),
    LOG_LEVEL: logLevel,
    TRUST_PROXY: booleano,
    DATABASE_URL: z.string().min(1),
    RATE_LIMIT_MAX: z.coerce.number().int().positive(),
    RATE_LIMIT_TIME_WINDOW: z.string().min(1),
    SECTIONS_PAGE_SIZE_DEFAULT: z.coerce.number().int().positive(),
    SECTIONS_PAGE_SIZE_MAX: z.coerce.number().int().positive(),
  })
  .superRefine((valores, ctx) => {
    if (valores.SECTIONS_PAGE_SIZE_MAX < valores.SECTIONS_PAGE_SIZE_DEFAULT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SECTIONS_PAGE_SIZE_MAX'],
        message: 'deve ser maior ou igual a SECTIONS_PAGE_SIZE_DEFAULT',
      });
    }
  });

const workerSchema = z.object({
  NODE_ENV: nodeEnv,
  LOG_LEVEL: logLevel,
  DATABASE_URL: z.string().min(1),
  BWEB_INPUT_DIR: z.string().min(1),
  BWEB_STORAGE_DIR: z.string().min(1),
});

const migrateSchema = z.object({
  NODE_ENV: nodeEnv,
  DATABASE_MIGRATION_URL: z.string().min(1),
});

function carregar(schema, origem) {
  const resultado = schema.safeParse(origem);
  if (resultado.success) return resultado.data;

  const variaveis = [...new Set(resultado.error.issues.map((issue) => issue.path[0]).filter(Boolean))];
  throw new Error(`Configuração inválida: ${variaveis.join(', ')}`);
}

export function loadApiEnv(origem = process.env) {
  return carregar(apiSchema, origem);
}

export function loadWorkerEnv(origem = process.env) {
  return carregar(workerSchema, origem);
}

export function loadMigrateEnv(origem = process.env) {
  return carregar(migrateSchema, origem);
}
