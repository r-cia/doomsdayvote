import { criarDb } from '../db/index.js';
import { loadStatusEnv } from '../env.js';
import { coletarStatus, formatarStatus } from '../modules/importacao/status-carga.js';

function lerArgumentos(argv) {
  const opcoes = { lote: null, json: false };
  for (let indice = 0; indice < argv.length; indice += 1) {
    if (argv[indice] === '--lote') opcoes.lote = argv[indice + 1] ?? '';
    else if (argv[indice] === '--json') opcoes.json = true;
  }
  return opcoes;
}

async function main() {
  let env;
  try {
    env = loadStatusEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const opcoes = lerArgumentos(process.argv.slice(2));
  if (opcoes.lote === '') {
    console.error('uso: npm run carga:status -- [--lote <id>] [--json]');
    process.exit(1);
  }

  const db = criarDb({ connectionString: env.DATABASE_URL });

  try {
    const status = await coletarStatus(db, { lote: opcoes.lote });
    if (!status) {
      console.error(`lote não encontrado: ${opcoes.lote}`);
      process.exitCode = 1;
      return;
    }
    console.log(opcoes.json ? JSON.stringify(status, null, 2) : formatarStatus(status));
  } finally {
    await db.destroy();
  }
}

main();
