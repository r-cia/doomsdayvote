import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { resolverCorte } from '../../src/modules/apuracao/corte.js';
import { somarMetricasSecao, somarVotos } from '../../src/modules/apuracao/totais.js';
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

describe('somas e métricas', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-totais-'));
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
    'soma votos por votável e consolida métricas sem inflar',
    async () => {
      await importar('bweb-1t_ac_2026.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');

      const esperado = new Map();
      const secoes = new Map();
      let naiveAptos = 0;

      const arquivo = await lerArquivoBweb(caminhoFixture('bweb-1t_ac_2026.csv'));
      for await (const registro of arquivo.registros) {
        const v = registro.valores;
        if (v.DS_CARGO_PERGUNTA !== 'Presidente') continue;
        const chave = `${v.CD_TIPO_VOTAVEL}|${v.NR_VOTAVEL}`;
        esperado.set(chave, (esperado.get(chave) ?? 0) + (v.QT_VOTOS ?? 0));
        naiveAptos += v.QT_APTOS ?? 0;
        const secao = `${v.CD_MUNICIPIO}|${v.NR_ZONA}|${v.NR_SECAO}`;
        if (!secoes.has(secao)) secoes.set(secao, v.QT_APTOS ?? 0);
      }

      const votos = await somarVotos(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      for (const [chave, total] of esperado) {
        const linha = votos.find((item) => `${item.cd_tipo_votavel}|${item.nr_votavel}` === chave);
        expect(linha.qt_votos).toBe(total);
      }
      expect(votos[0].percentual).not.toBeNull();

      const metricas = await somarMetricasSecao(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      const dedupAptos = [...secoes.values()].reduce((total, valor) => total + valor, 0);
      expect(metricas.qt_aptos).toBe(dedupAptos);
      expect(naiveAptos).toBeGreaterThan(dedupAptos);
      expect(metricas.bus_considerados).toBe(secoes.size);

      const antes = await somarVotos(db, {
        eleicaoId,
        cargo,
        corte: resolverCorte({ as_of: '2026-10-04T17:08:43-03:00' }),
      });
      expect(antes).toEqual([]);
      const metricasAntes = await somarMetricasSecao(db, {
        eleicaoId,
        cargo,
        corte: resolverCorte({ as_of: '2026-10-04T17:08:43-03:00' }),
      });
      expect(metricasAntes.bus_considerados).toBe(0);
    },
    { timeout: 120000 },
  );

  it(
    'ignora cargos fora do escopo',
    async () => {
      await importar('bweb-1t_ac_2026.csv');
      const { eleicaoId, cargo } = await alvoCargo('Senador');
      const votos = await somarVotos(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      expect(votos).toEqual([]);
    },
    { timeout: 120000 },
  );
});
