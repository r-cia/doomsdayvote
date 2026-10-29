import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { contar, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture, FIXTURES, LINHAS_POR_FIXTURE } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let storageDir;

describe('importação dos fixtures com proveniência', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-fixtures-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it(
    'importa os fixtures disponíveis separados por ano, UF e turno',
    async () => {
      for (const nome of FIXTURES) {
        const resultado = await importarArquivo({
          db,
          caminho: caminhoFixture(nome),
          nomeArquivo: nome,
          storageDir,
        });

        expect(resultado.ignorado).toBe(false);
        expect(resultado.lote.status).toBe('concluido');
        expect(resultado.lote.qt_linhas).toBe(LINHAS_POR_FIXTURE[nome]);
        expect(resultado.lote.sha256).toMatch(/^[0-9a-f]{64}$/);
      }

      expect(await contar(db, 'lote_importacao')).toBe(FIXTURES.length);
      const eleicoes = await db
        .selectFrom('eleicao')
        .select(['ano_eleicao', 'nr_turno'])
        .distinct()
        .execute();
      expect(eleicoes).toHaveLength(6);

      const semOrigem = await db
        .selectFrom('resultado_votavel')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('lote_id', 'is', null)
        .executeTakeFirstOrThrow();
      expect(Number(semOrigem.total)).toBe(0);

      const semLinha = await db
        .selectFrom('resultado_votavel')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('nr_linha_origem', 'is', null)
        .executeTakeFirstOrThrow();
      expect(Number(semLinha.total)).toBe(0);

      const segundo = await importarArquivo({
        db,
        caminho: caminhoFixture(FIXTURES[0]),
        nomeArquivo: FIXTURES[0],
        storageDir,
      });
      expect(segundo.ignorado).toBe(true);
      expect(await contar(db, 'lote_importacao')).toBe(FIXTURES.length);
    },
    { timeout: 180000 },
  );
});
