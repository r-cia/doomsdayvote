import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { resolverCorte } from '../../src/modules/apuracao/corte.js';
import { contarSecoesComBu } from '../../src/modules/apuracao/progresso.js';
import { somarMetricasSecao, somarVotos } from '../../src/modules/apuracao/totais.js';
import { dividirLinhaBweb } from '../../src/modules/importacao/bweb/leitor.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let storageDir;

function juntar(campos) {
  return campos.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(';');
}

async function importar(nome) {
  const resultado = await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
  await atualizarViews(db);
  return resultado;
}

async function alvoCargo(nome) {
  const linha = await db
    .selectFrom('boletim_versao')
    .select(['eleicao_id', 'cd_cargo_pergunta'])
    .where('ds_cargo_pergunta', '=', nome)
    .executeTakeFirstOrThrow();
  return { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
}

describe('regressão da apuração', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-regressao-'));
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
    'idempotência, corte, versão única e métricas',
    async () => {
      await importar('bweb-1t_ac_2026.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const final = resolverCorte({});

      const votosAntes = await somarVotos(db, { eleicaoId, cargo, corte: final });
      const metricasAntes = await somarMetricasSecao(db, { eleicaoId, cargo, corte: final });
      const secoesAntes = await contarSecoesComBu(db, { eleicaoId, cargo, corte: final });
      const versoesAntes = await db
        .selectFrom('boletim_versao')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('ativo', '=', true)
        .executeTakeFirstOrThrow();

      expect(await contarSecoesComBu(db, {
        eleicaoId,
        cargo,
        corte: resolverCorte({ as_of: '2026-10-04T17:08:43-03:00' }),
      })).toBe(0);

      const repetido = await importar('bweb-1t_ac_2026.csv');
      expect(repetido.ignorado).toBe(true);
      expect(await somarVotos(db, { eleicaoId, cargo, corte: final })).toEqual(votosAntes);
      expect(await somarMetricasSecao(db, { eleicaoId, cargo, corte: final })).toEqual(metricasAntes);

      const conteudo = await readFile(caminhoFixture('bweb-1t_ac_2026.csv'), 'latin1');
      const linhas = conteudo.split(/\r?\n/);
      const header = dividirLinhaBweb(linhas[0]);
      const indiceCargo = header.indexOf('DS_CARGO_PERGUNTA');
      const indiceVotos = header.indexOf('QT_VOTOS');
      const indiceNr = header.indexOf('NR_VOTAVEL');
      let alterado = false;
      const corpo = linhas.slice(1).filter(Boolean).map((linha) => {
        const campos = dividirLinhaBweb(linha);
        if (!alterado && campos[indiceCargo] === 'Presidente') {
          campos[indiceVotos] = String(Number(campos[indiceVotos]) + 1);
          alterado = true;
        }
        return juntar(campos);
      });
      expect(alterado).toBe(true);

      const destino = path.join(storageDir, 'bweb-1t_ac_2026-versao.csv');
      await writeFile(destino, `${linhas[0]}\n${corpo.join('\n')}\n`, 'latin1');
      await importarArquivo({ db, caminho: destino, nomeArquivo: path.basename(destino), storageDir });
      await atualizarViews(db);

      const votosDepois = await somarVotos(db, { eleicaoId, cargo, corte: final });
      const totalAntes = votosAntes.reduce((total, item) => total + item.qt_votos, 0);
      const totalDepois = votosDepois.reduce((total, item) => total + item.qt_votos, 0);
      expect(totalDepois).toBe(totalAntes + 1);

      const versoesDepois = await db
        .selectFrom('boletim_versao')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('ativo', '=', true)
        .executeTakeFirstOrThrow();
      expect(Number(versoesDepois.total)).toBe(Number(versoesAntes.total));
      expect(secoesAntes).toBeGreaterThan(0);
    },
    { timeout: 180000 },
  );

  it(
    '2018 não entra em corte temporal',
    async () => {
      await importar('bweb_2t_AC_301020181744.csv');
      const { eleicaoId, cargo } = await alvoCargo('Presidente');
      const final = await contarSecoesComBu(db, { eleicaoId, cargo, corte: { tipo: 'final' } });
      expect(final).toBeGreaterThan(0);
      expect(
        await contarSecoesComBu(db, {
          eleicaoId,
          cargo,
          corte: resolverCorte({ as_of: '2018-10-30T12:00:00-03:00' }),
        }),
      ).toBe(0);
    },
    { timeout: 120000 },
  );
});
