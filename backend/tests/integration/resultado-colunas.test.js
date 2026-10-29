import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
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
let storageDir;

describe('colunas de resultado_votavel', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-colunas-'));
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
    'preenche ano, turno, UF, município, zona, seção e cargo sem bruto',
    async () => {
      await importarArquivo({
        db,
        caminho: caminhoFixture('bweb-1t_ac_2026.csv'),
        nomeArquivo: 'bweb-1t_ac_2026.csv',
        storageDir,
      });

      const { rows } = await sql`
        select ano_eleicao, nr_turno, sg_uf, cd_municipio_tse, nr_zona,
               nr_secao, cd_cargo_pergunta
        from resultado_votavel
        limit 1
      `.execute(db);

      expect(rows).toHaveLength(1);
      expect(rows[0].ano_eleicao).toBe(2026);
      expect(rows[0].nr_turno).toBe(1);
      expect(rows[0].sg_uf).toBe('AC');
      expect(Number(rows[0].cd_municipio_tse)).toBeGreaterThan(0);
      expect(Number(rows[0].nr_zona)).toBeGreaterThan(0);
      expect(Number(rows[0].nr_secao)).toBeGreaterThan(0);
      expect(Number(rows[0].cd_cargo_pergunta)).toBeGreaterThan(0);

      const { rows: colunas } = await sql`
        select column_name
        from information_schema.columns
        where table_schema = 'public' and table_name = 'resultado_votavel'
      `.execute(db);

      expect(colunas.map((coluna) => coluna.column_name)).not.toContain('bruto');
    },
    { timeout: 120000 },
  );
});
