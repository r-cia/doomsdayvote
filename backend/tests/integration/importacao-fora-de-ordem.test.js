import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const fixture = caminhoFixture('bweb-1t_ac_2026.csv');

let storageDir;
let base;

async function contar(tabela) {
  const { rows } = await sql`select count(*)::int as total from ${sql.table(tabela)}`.execute(db);
  return rows[0].total;
}

async function escreverEmbaralhado() {
  const conteudo = await readFile(fixture, 'latin1');
  const linhas = conteudo.split(/\r?\n/);
  const cabecalho = linhas[0];
  const corpo = linhas.slice(1).filter((linha) => linha !== '');
  const metade = Math.ceil(corpo.length / 2);
  const inicio = corpo.slice(0, metade);
  const fim = corpo.slice(metade);
  const embaralhado = [];

  for (let i = 0; i < Math.max(inicio.length, fim.length); i += 1) {
    if (inicio[i]) embaralhado.push(inicio[i]);
    if (fim[i]) embaralhado.push(fim[i]);
  }

  const destino = path.join(base, 'bweb-1t_ac_2026-embaralhado.csv');
  await writeFile(destino, `${cabecalho}\n${embaralhado.join('\n')}\n`, 'latin1');
  return destino;
}

describe('importação fora de ordem', () => {
  beforeAll(async () => {
    base = await mkdtemp(path.join(tmpdir(), 'bweb-fora-ordem-'));
    storageDir = path.join(base, 'storage');
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(base, { recursive: true, force: true });
  });

  it(
    'produz os mesmos totais com as linhas intercaladas',
    async () => {
      const normal = await importarArquivo({
        db,
        caminho: fixture,
        nomeArquivo: 'bweb-1t_ac_2026.csv',
        storageDir,
      });

      const versoes = await contar('boletim_versao');
      const resultados = await contar('resultado_votavel');
      expect(versoes).toBeGreaterThan(0);
      expect(resultados).toBeGreaterThan(0);

      await limparBanco(db);

      const foraDeOrdem = await importarArquivo({
        db,
        caminho: await escreverEmbaralhado(),
        nomeArquivo: 'bweb-1t_ac_2026-embaralhado.csv',
        storageDir,
      });

      expect(foraDeOrdem.lote.qt_linhas).toBe(normal.lote.qt_linhas);
      expect(await contar('boletim_versao')).toBe(versoes);
      expect(await contar('resultado_votavel')).toBe(resultados);
    },
    { timeout: 180000 },
  );
});
