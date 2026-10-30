import { loadWorkerEnv } from '../env.js';
import { criarDb } from '../db/index.js';
import { readdir, unlink, stat } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  let env;
  try {
    env = loadWorkerEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const storageDir = env.BWEB_STORAGE_DIR || '../data/storage';
  const originaisDir = path.join(storageDir, 'originais');

  const db = criarDb({ connectionString: env.DATABASE_URL });

  // SHAs efetivamente importados (concluídos)
  const lotes = await db
    .selectFrom('lote_importacao')
    .select(['sha256', 'status'])
    .where('status', '=', 'concluido')
    .execute();

  const shasImportados = new Set(lotes.map((l) => l.sha256));

  let arquivos;
  try {
    arquivos = await readdir(originaisDir);
  } catch (erro) {
    console.error(`Diretório não encontrado: ${originaisDir}`);
    await db.destroy();
    process.exit(1);
  }

  let removidos = 0;
  let liberados = 0;
  let mantidos = 0;

  for (const nome of arquivos) {
    const sha = nome.replace(/\.[^.]+$/, '');
    const caminho = path.join(originaisDir, nome);
    const info = await stat(caminho);

    if (shasImportados.has(sha)) {
      await unlink(caminho);
      removidos += 1;
      liberados += info.size;
    } else {
      mantidos += 1;
    }
  }

  await db.destroy();

  console.log(
    JSON.stringify(
      {
        removidos,
        mantidos,
        liberados_bytes: liberados,
        liberados_mb: Math.round((liberados / 1024 / 1024) * 100) / 100,
      },
      null,
      2,
    ),
  );
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});