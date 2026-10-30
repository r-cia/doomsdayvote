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
let cargo;
let eleicao;

async function importar(nome) {
  return importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
}

describe('consistência aritmética', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-consistencia-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    await importar('bweb_1t_AC_14102014131600.txt');

    const linha = await db
      .selectFrom('boletim_versao as bv')
      .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
      .select(['bv.eleicao_id', 'bv.cd_cargo_pergunta'])
      .where('bv.ativo', '=', true)
      .where('bv.cd_tipo_urna', '=', 1)
      .executeTakeFirst();
    cargo = linha.cd_cargo_pergunta;
    eleicao = linha.eleicao_id;
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('retorna estrutura de cobertura e paginação', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/consistencia?election_id=${eleicao}&cargo=${cargo}`,
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.cobertura).toBeDefined();
    expect(typeof corpo.cobertura.consideradas).toBe('number');
    expect(corpo.cobertura.sem_campo_por_regra).toBeDefined();
    expect(Array.isArray(corpo.limitacoes)).toBe(true);
    expect(Array.isArray(corpo.itens)).toBe(true);
    expect(typeof corpo.total).toBe('number');
  });

  it('filtra por regra', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/consistencia?election_id=${eleicao}&cargo=${cargo}&regra=biometria_vs_comparecimento`,
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    for (const item of corpo.itens) {
      expect(item.regra).toBe('biometria_vs_comparecimento');
    }
  });

  it('enriquece seção com campo consistencia', async () => {
    const secao = await db
      .selectFrom('secao_eleitoral as s')
      .select('s.id')
      .executeTakeFirst();
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/sections/${secao.id}?election_id=${eleicao}&cargo=${cargo}`,
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(Array.isArray(corpo.consistencia)).toBe(true);
    expect(corpo.consistencia).toHaveLength(4);
  });
});