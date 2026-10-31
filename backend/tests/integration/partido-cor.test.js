import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarDb } from '../../src/db/index.js';
import { somarVotos } from '../../src/modules/apuracao/totais.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, contar, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const execFileAsync = promisify(execFile);
const backendDir = fileURLToPath(new URL('../..', import.meta.url));
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const cores = JSON.parse(await readFile(new URL('../../data/partido-cores.json', import.meta.url), 'utf8'));
let storageDir;

function ambiente() {
  return {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: url,
    BWEB_INPUT_DIR: '../data',
    BWEB_STORAGE_DIR: '../data/storage',
  };
}

async function semear() {
  return execFileAsync('node', ['src/scripts/seed-cores.js'], { cwd: backendDir, env: ambiente() });
}

async function alvoCargo(nome) {
  const linha = await db
    .selectFrom('boletim_versao')
    .select(['eleicao_id', 'cd_cargo_pergunta'])
    .where('ds_cargo_pergunta', '=', nome)
    .executeTakeFirstOrThrow();
  return { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
}

describe('cores de partido', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-cores-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('seed é idempotente e não sobrescreve cor manual', async () => {
    await semear();
    expect(await contar(db, 'partido_cor')).toBe(cores.length);
    await semear();
    expect(await contar(db, 'partido_cor')).toBe(cores.length);

    await db
      .updateTable('partido_cor')
      .set({ cor_hex: '#000001', fonte: 'manual' })
      .where('sg_partido', '=', 'PT')
      .execute();
    await semear();

    const pt = await db
      .selectFrom('partido_cor')
      .selectAll()
      .where('sg_partido', '=', 'PT')
      .executeTakeFirstOrThrow();
    expect(pt.cor_hex).toBe('#000001');
  });

  it('rejeita cor fora do formato', async () => {
    await expect(
      db
        .insertInto('partido_cor')
        .values({ sg_partido: 'X', cor_hex: 'red', fonte: 'manual' })
        .execute(),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it(
    'a API de votos devolve cor_hex',
    async () => {
      await importarArquivo({
        db,
        caminho: caminhoFixture('bweb-1t_ac_2026.csv'),
        nomeArquivo: 'bweb-1t_ac_2026.csv',
        storageDir,
      });
      await semear();
      await atualizarViews();
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const votos = await somarVotos(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      expect(votos.some((voto) => voto.cor_hex)).toBe(true);
    },
    { timeout: 120000 },
  );
});
