import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { limparBanco } from '../helpers/db-teste.js';
import { NOME_2026, gerarBwebMulti, secoes2026 } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let diretorio;

async function contar(tabela) {
  const { rows } = await sql`select count(*)::int as total from ${sql.table(tabela)}`.execute(db);
  return rows[0].total;
}

async function escreverEmbaralhado(conteudo) {
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

  const destino = path.join(diretorio, 'bweb-sintetico-2026-embaralhado.csv');
  await writeFile(destino, `${cabecalho}\n${embaralhado.join('\n')}\n`, 'latin1');
  return destino;
}

describe('importação fora de ordem', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-fora-ordem-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it(
    'produz os mesmos totais com as linhas intercaladas',
    async () => {
      const conteudo = gerarBwebMulti(secoes2026(8));
      const caminho = path.join(diretorio, NOME_2026);
      await writeFile(caminho, conteudo, 'latin1');

      const normal = await importarArquivo({
        db,
        caminho,
        nomeArquivo: NOME_2026,
      });

      const versoes = await contar('boletim_versao');
      const resultados = await contar('resultado_votavel');
      expect(versoes).toBeGreaterThan(0);
      expect(resultados).toBeGreaterThan(0);

      await limparBanco(db);

      const foraDeOrdem = await importarArquivo({
        db,
        caminho: await escreverEmbaralhado(conteudo),
        nomeArquivo: 'bweb-sintetico-2026-embaralhado.csv',
      });

      expect(foraDeOrdem.lote.qt_linhas).toBe(normal.lote.qt_linhas);
      expect(await contar('boletim_versao')).toBe(versoes);
      expect(await contar('resultado_votavel')).toBe(resultados);
    },
    { timeout: 180000 },
  );
});
