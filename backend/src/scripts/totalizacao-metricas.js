import { criarDb } from '../db/index.js';
import { loadTotalizacaoEnv } from '../env.js';
import { recalcularMetricasDoLote } from '../modules/totalizacao/metricas-zona.js';

async function main() {
  let env;
  try {
    env = loadTotalizacaoEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const db = criarDb({
    connectionString: env.DATABASE_URL,
    statementTimeout: 0,
    poolMax: 2,
    workMemMb: env.DB_WORK_MEM_MB,
  });

  try {
    const lotes = await db
      .selectFrom('totalizacao_lote as l')
      .select(['l.id', 'l.sg_uf', 'l.ano_eleicao', 'l.nr_turno'])
      .where('l.status', 'in', ['concluido', 'parcial'])
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom('totalizacao_zona_metrica as z').select('z.lote_id').whereRef('z.lote_id', '=', 'l.id'),
          ),
        ),
      )
      .orderBy('l.ano_eleicao')
      .orderBy('l.nr_turno')
      .orderBy('l.sg_uf')
      .execute();

    for (const lote of lotes) {
      const inicio = Date.now();
      await db.transaction().execute((trx) => recalcularMetricasDoLote(trx, lote.id));
      console.log(
        `${lote.ano_eleicao} ${lote.nr_turno}t ${lote.sg_uf}: métricas gravadas em ${Math.round((Date.now() - inicio) / 1000)}s`,
      );
    }
    console.log(`${lotes.length} lote(s) processado(s)`);
  } finally {
    await db.destroy();
  }
}

main();
