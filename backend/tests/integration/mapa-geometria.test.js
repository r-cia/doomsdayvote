import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { localidadesSemGeometria, totaisPorArea } from '../../src/modules/apuracao/totais.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { CENARIO, NOME_2026, escreverArquivo, gerarBweb } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let diretorio;

async function alvoCargo(nome) {
  const linha = await db
    .selectFrom('boletim_versao')
    .select(['eleicao_id', 'cd_cargo_pergunta'])
    .where('ds_cargo_pergunta', '=', nome)
    .executeTakeFirstOrThrow();
  return { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
}

describe('geometria do mapa', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-mapa-'));
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
    'devolve o código IBGE da UF e lista as localidades sem malha',
    async () => {
      const caminho = await escreverArquivo(diretorio, NOME_2026, gerarBweb());
      await importarArquivo({ db, caminho, nomeArquivo: NOME_2026 });
      await atualizarViews(db);
      const { eleicaoId, cargo } = await alvoCargo('Presidente');

      const areas = await totaisPorArea(db, {
        eleicaoId,
        cargo,
        corte: { tipo: 'final' },
        nivel: 'uf',
      });

      expect(areas).toHaveLength(1);
      expect(areas[0].sg_uf).toBe(CENARIO.uf);
      expect(areas[0].geom_id).toBe('12');
      expect(areas[0].nm_municipio).toBeNull();

      const semGeometria = await localidadesSemGeometria(db);
      expect(semGeometria.length).toBeGreaterThan(0);
      expect(semGeometria.every((localidade) => localidade.sg_uf === CENARIO.uf)).toBe(true);

      const alvo = semGeometria[0];
      await db
        .updateTable('localidade')
        .set({ cd_municipio_ibge: 1200013, geom_id: '1200013' })
        .where('sg_uf', '=', alvo.sg_uf)
        .where('cd_municipio_tse', '=', alvo.cd_municipio_tse)
        .execute();

      const restantes = await localidadesSemGeometria(db, { sgUf: 'AC' });
      expect(restantes).toHaveLength(semGeometria.length - 1);
      expect(
        restantes.some(
          (localidade) =>
            localidade.sg_uf === alvo.sg_uf &&
            localidade.cd_municipio_tse === alvo.cd_municipio_tse,
        ),
      ).toBe(false);

      const semGeometriaOutraUf = await localidadesSemGeometria(db, { sgUf: 'SP' });
      expect(semGeometriaOutraUf).toEqual([]);
    },
  );
});
