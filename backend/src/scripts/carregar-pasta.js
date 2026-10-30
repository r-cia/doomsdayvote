import pg from 'pg';
import { loadWorkerEnv } from '../env.js';
import { criarDb } from '../db/index.js';
import { criarCache } from '../lib/cache.js';
import { carregarPasta } from '../modules/importacao/carregar-pasta.js';

const LOCK = 727274;

async function main() {
  let env;
  try {
    env = loadWorkerEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const cliente = new pg.Client({ connectionString: env.DATABASE_URL });
  await cliente.connect();
  await cliente.query('SET statement_timeout = 0');
  const { rows } = await cliente.query('select pg_try_advisory_lock($1) as ok', [LOCK]);
  if (!rows[0].ok) {
    console.error('CARGA_EM_ANDAMENTO');
    await cliente.end();
    process.exit(2);
  }

  // Lote offline: COPY de arquivos grandes passa dos 60s do limite padrão.
  const db = criarDb({ connectionString: env.DATABASE_URL, statementTimeout: 0 });
  const cache = criarCache({ url: env.REDIS_URL });

  try {
    const resumo = await carregarPasta({
      db,
      inputDir: env.BWEB_INPUT_DIR,
      storageDir: env.BWEB_STORAGE_DIR,
      skipCargosLegislativos: env.BWEB_SKIP_CARGOS_LEGISLATIVOS,
    });
    console.log(JSON.stringify(resumo, null, 2));
    await cliente
      .query('refresh materialized view concurrently mv_votos_final')
      .catch(() => cliente.query('refresh materialized view mv_votos_final'));
    await cliente
      .query('refresh materialized view concurrently mv_metricas_final')
      .catch(() => cliente.query('refresh materialized view mv_metricas_final'));
    await cliente
      .query('refresh materialized view concurrently mv_totais_area')
      .catch(() => cliente.query('refresh materialized view mv_totais_area'));
    await cache.invalidar();
    await cache.fechar();
    await db.destroy();
    await cliente.query('select pg_advisory_unlock($1)', [LOCK]);
    await cliente.end();
    process.exit(resumo.falhas > 0 ? 1 : 0);
  } catch (erro) {
    console.error(erro.message);
    await cache.fechar();
    await db.destroy();
    await cliente.end();
    process.exit(1);
  }
}

main();
