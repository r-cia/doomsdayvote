import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { resolverCorte } from '../../src/modules/apuracao/corte.js';
import { contarSecoesComBu } from '../../src/modules/apuracao/progresso.js';
import { lerArquivoBweb } from '../../src/modules/importacao/bweb/ler-arquivo.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let storageDir;

async function importar(nome) {
  return importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
}

async function alvoCargo(nome) {
  const linha = await db
    .selectFrom('boletim_versao')
    .select(['eleicao_id', 'cd_cargo_pergunta'])
    .where('ds_cargo_pergunta', '=', nome)
    .executeTakeFirstOrThrow();
  return { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
}

describe('seções com BU', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-progresso-'));
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
    'conta seções distintas por cargo e corte',
    async () => {
      await importar('bweb-1t_ac_2026.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');

      const secoes = new Set();
      const arquivo = await lerArquivoBweb(caminhoFixture('bweb-1t_ac_2026.csv'));
      for await (const registro of arquivo.registros) {
        const v = registro.valores;
        if (v.DS_CARGO_PERGUNTA !== 'Presidente') continue;
        secoes.add(`${v.CD_MUNICIPIO}|${v.NR_ZONA}|${v.NR_SECAO}`);
      }

      const final = await contarSecoesComBu(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      expect(final).toBe(secoes.size);
      expect(
        await contarSecoesComBu(db, {
          eleicaoId,
          cargo,
          corte: resolverCorte({ as_of: '2026-10-04T17:08:43-03:00' }),
        }),
      ).toBe(0);
      expect(
        await contarSecoesComBu(db, {
          eleicaoId,
          cargo,
          corte: resolverCorte({ as_of: '2026-10-04T20:40:01-03:00' }),
        }),
      ).toBe(final);
    },
    { timeout: 120000 },
  );
});
