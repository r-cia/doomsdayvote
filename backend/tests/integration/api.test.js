import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { registrarRotas } from '../../src/routes/index.js';
import { limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

let storageDir;
let alvo;

async function importar(nome) {
  return importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
}

describe('API de leitura', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-api-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    await importar('bweb-1t_ac_2026.csv');
    const linha = await db
      .selectFrom('boletim_versao')
      .select(['eleicao_id', 'cd_cargo_pergunta'])
      .where('ds_cargo_pergunta', '=', 'Presidente')
      .executeTakeFirstOrThrow();
    alvo = { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it(
    'lista eleições, resumo e linha do tempo',
    async () => {
      const eleicoes = await app.inject({ method: 'GET', url: '/api/elections' });
      expect(eleicoes.statusCode).toBe(200);
      expect(eleicoes.json().eleicoes.length).toBeGreaterThan(0);

      const resumo = await app.inject({
        method: 'GET',
        url: `/api/summary?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(resumo.statusCode).toBe(200);
      const corpo = resumo.json();
      expect(corpo.secoes_com_bu).toBeGreaterThan(0);
      expect(corpo.votos.length).toBeGreaterThan(0);
      expect(corpo.metricas.bus_considerados).toBeGreaterThan(0);

      const antes = await app.inject({
        method: 'GET',
        url: `/api/summary?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&as_of=2026-10-04T17:08:43-03:00`,
      });
      expect(antes.json().secoes_com_bu).toBe(0);

      const timeline = await app.inject({
        method: 'GET',
        url: `/api/timeline?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&granularity=5m`,
      });
      expect(timeline.statusCode).toBe(200);
      expect(timeline.json().pontos.length).toBeGreaterThan(0);
    },
    { timeout: 120000 },
  );

  it(
    'mapa, seções e detalhe',
    async () => {
      const mapa = await app.inject({
        method: 'GET',
        url: `/api/map?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&level=uf`,
      });
      expect(mapa.statusCode).toBe(200);
      expect(mapa.json().areas.length).toBeGreaterThan(0);

      const secoes = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&status=bu_recebido&page=1&page_size=10`,
      });
      expect(secoes.statusCode).toBe(200);
      const corpo = secoes.json();
      expect(corpo.total).toBeGreaterThan(0);
      expect(corpo.items).toHaveLength(10);

      const busca = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&busca=rio`,
      });
      expect(busca.json().total).toBeGreaterThan(0);

      const detalhe = await app.inject({
        method: 'GET',
        url: `/api/sections/${corpo.items[0].id}?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(detalhe.statusCode).toBe(200);
      expect(detalhe.json().secao.id).toBe(corpo.items[0].id);
      expect(detalhe.json().boletim).toBeTruthy();
    },
    { timeout: 120000 },
  );
});
