import { readFile } from 'node:fs/promises';
import { loadWorkerEnv } from '../env.js';
import { criarDb } from '../db/index.js';

const env = loadWorkerEnv();
const cores = JSON.parse(await readFile(new URL('../../data/partido-cores.json', import.meta.url), 'utf8'));

for (const cor of cores) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(cor.cor_hex) || !cor.fonte) {
    throw new Error(`Cor inválida para ${cor.sg_partido}`);
  }
}

const db = criarDb({ connectionString: env.DATABASE_URL });

for (const cor of cores) {
  await db
    .insertInto('partido_cor')
    .values({ sg_partido: cor.sg_partido, cor_hex: cor.cor_hex, fonte: cor.fonte })
    .onConflict((oc) => oc.column('sg_partido').doNothing())
    .execute();
}

await db.destroy();
console.log(`${cores.length} cores processadas`);
