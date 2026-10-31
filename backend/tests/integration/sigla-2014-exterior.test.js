import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { preencherSiglaExterior } from '../../src/migrations/0012_sg_partido_2014_exterior.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let storageDir;

describe('sigla do exterior (ZZ) em 2014', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-sigla-zz-'));
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
    'preenche a sigla das linhas ZZ sem partido a partir do mesmo nr_partido nas outras UFs',
    async () => {
      const nome = 'bweb_1t_AC_14102014131600.txt';
      await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });

      const { rows: alvo } = await sql`
        select bv.id
        from boletim_versao bv
        join resultado_votavel rv on rv.boletim_versao_id = bv.id
        where bv.cd_cargo_pergunta = 1 and rv.nr_partido is not null and rv.nm_partido is not null
        group by bv.id
        order by bv.id
        limit 1
      `.execute(db);
      const boletimId = alvo[0].id;

      const { rows: esperadas } = await sql`
        select id, nm_partido from resultado_votavel where boletim_versao_id = ${boletimId} and nr_partido is not null and nm_partido is not null
      `.execute(db);
      expect(esperadas.length).toBeGreaterThan(0);

      await sql`
        update resultado_votavel
        set sg_uf = 'ZZ', sg_partido = null, nm_partido = null
        where boletim_versao_id = ${boletimId} and nr_partido is not null and nm_partido is not null
      `.execute(db);
      await atualizarViews();

      await preencherSiglaExterior(db);

      const { rows: atuais } = await sql`
        select id, sg_partido from resultado_votavel where boletim_versao_id = ${boletimId} and sg_uf = 'ZZ'
      `.execute(db);
      const porId = new Map(atuais.map((linha) => [linha.id, linha.sg_partido]));
      const preenchidas = esperadas.filter((linha) => porId.get(linha.id) === linha.nm_partido);
      expect(preenchidas.length).toBeGreaterThan(0);
      for (const linha of esperadas) {
        expect([linha.nm_partido, null]).toContain(porId.get(linha.id));
      }
    },
    { timeout: 120000 },
  );
});
