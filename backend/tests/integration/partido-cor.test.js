import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarDb } from '../../src/db/index.js';
import { somarVotos } from '../../src/modules/apuracao/totais.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, contar, limparBanco } from '../helpers/db-teste.js';
import { NOME_2026, escreverArquivo, gerarBweb } from '../helpers/fixtures.js';

const execFileAsync = promisify(execFile);
const backendDir = fileURLToPath(new URL('../..', import.meta.url));
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let diretorio;

function ambiente() {
  return {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: url,
    DATABASE_MIGRATION_URL: process.env.TEST_DATABASE_MIGRATION_URL,
    BWEB_INPUT_DIR: diretorio,
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
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-cores-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it('seed é idempotente e não sobrescreve cor manual', async () => {
    await semear();
    const total = await contar(db, 'partido_cor');
    expect(total).toBeGreaterThan(0);
    await semear();
    expect(await contar(db, 'partido_cor')).toBe(total);

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
      const caminho = await escreverArquivo(
        diretorio,
        NOME_2026,
        gerarBweb({
          nrPartido: 13,
          sgPartido: 'PT',
          nmPartido: 'Partido dos Trabalhadores',
        }),
      );
      await importarArquivo({ db, caminho, nomeArquivo: NOME_2026 });
      await semear();
      await atualizarViews();
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const votos = await somarVotos(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      expect(votos.filter((voto) => voto.categoria === 'nominal').every((voto) => voto.cor_hex)).toBe(true);
    },
    { timeout: 120000 },
  );
});
