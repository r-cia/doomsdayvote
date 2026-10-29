import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { resolverCorte } from '../../src/modules/apuracao/corte.js';
import { classificarStatusSecao } from '../../src/modules/apuracao/status-secao.js';
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

async function busAtivos(eleicaoId, cargo) {
  return db
    .selectFrom('boletim_versao')
    .selectAll()
    .where('eleicao_id', '=', eleicaoId)
    .where('cd_cargo_pergunta', '=', cargo)
    .where('ativo', '=', true)
    .execute();
}

describe('status de seção com fixtures', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-status-'));
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
    '2026: nenhum BU recebido antes do primeiro e todos no último horário',
    async () => {
      await importar('bweb-1t_ac_2026.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const bus = await busAtivos(eleicaoId, cargo);

      const antes = bus.map((bu) =>
        classificarStatusSecao(bu, resolverCorte({ as_of: '2026-10-04T17:08:43-03:00' })),
      );
      expect(antes.filter((item) => item.status === 'bu_recebido')).toHaveLength(0);

      const fim = bus.map((bu) =>
        classificarStatusSecao(bu, resolverCorte({ as_of: '2026-10-04T20:40:01-03:00' })),
      );
      expect(fim.filter((item) => item.status === 'bu_recebido')).toHaveLength(bus.length);
    },
    { timeout: 120000 },
  );

  it(
    '2018: recebimento ausente é desconhecido por precisão insuficiente',
    async () => {
      await importar('bweb_2t_AC_301020181744.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const bus = await busAtivos(eleicaoId, cargo);
      const corte = resolverCorte({ as_of: '2018-10-30T12:00:00-03:00' });

      expect(bus.length).toBeGreaterThan(0);
      for (const bu of bus) {
        expect(classificarStatusSecao(bu, corte)).toMatchObject({
          status: 'desconhecido',
          motivo: 'PRECISAO_INSUFICIENTE',
        });
      }
    },
    { timeout: 120000 },
  );
});
