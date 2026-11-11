import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { registrarRotas } from '../../src/routes/index.js';
import { limparBanco } from '../helpers/db-teste.js';
import { NOME_2014_1T, escreverArquivo, gerarBweb2014 } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

let diretorio;
let cargo;
let eleicao;

async function importar(nome, conteudo) {
  const caminho = await escreverArquivo(diretorio, nome, conteudo);
  return importarArquivo({ db, caminho, nomeArquivo: nome });
}

describe('versões de BU', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-versoes-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    await importar(NOME_2014_1T, gerarBweb2014());

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
    await rm(diretorio, { recursive: true, force: true });
  });

  it('retorna estrutura de versões', async () => {
    const secao = await db.selectFrom('secao_eleitoral as s').select('s.id').executeTakeFirst();
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/sections/${secao.id}/versions?election_id=${eleicao}&cargo=${cargo}`,
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.corte).toBeDefined();
    expect(corpo.secao).toBeDefined();
    expect(Array.isArray(corpo.versoes)).toBe(true);
    expect(corpo.versoes.length).toBeGreaterThan(0);
    const v = corpo.versoes[0];
    expect(v).toHaveProperty('versao');
    expect(v).toHaveProperty('ativo');
    expect(v).toHaveProperty('resultados');
    expect(v).toHaveProperty('lote');
    expect(v).toHaveProperty('conteudo_sha256');
  });

  it('aplica o corte ao boletim, aos resultados e às versões', async () => {
    const anterior = await db
      .selectFrom('boletim_versao as bv')
      .selectAll('bv')
      .where('bv.ativo', '=', true)
      .orderBy('bv.secao_id')
      .executeTakeFirstOrThrow();

    await db
      .updateTable('boletim_versao')
      .set({
        dt_bu_recebido_ts: new Date('2026-01-01T10:00:00Z'),
        dt_bu_recebido_data: null,
        precisao_dt_bu_recebido: 'DATA_HORA',
      })
      .where('id', '=', anterior.id)
      .execute();

    await db
      .updateTable('boletim_versao')
      .set({ ativo: false })
      .where('id', '=', anterior.id)
      .execute();

    const { id: _id, ...campos } = anterior;
    const atual = await db
      .insertInto('boletim_versao')
      .values({
        ...campos,
        versao: anterior.versao + 1,
        ativo: true,
        substitui_versao_id: anterior.id,
        conteudo_sha256: 'e'.repeat(64),
        dt_bu_recebido_ts: new Date('2026-01-01T12:00:00Z'),
        dt_bu_recebido_data: null,
        precisao_dt_bu_recebido: 'DATA_HORA',
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const resultados = await db
      .selectFrom('resultado_votavel')
      .selectAll()
      .where('boletim_versao_id', '=', anterior.id)
      .execute();
    expect(resultados.length).toBeGreaterThan(0);
    await db
      .insertInto('resultado_votavel')
      .values(
        resultados.map(({ id: _resultadoId, ...resultado }) => ({
          ...resultado,
          boletim_versao_id: atual.id,
        })),
      )
      .execute();

    const base = `election_id=${eleicao}&cargo=${cargo}`;
    const antes = await app.inject({
      method: 'GET',
      url: `/api/sections/${anterior.secao_id}?${base}&as_of=2026-01-01T11:00:00Z`,
    });
    expect(antes.statusCode).toBe(200);
    const corpoAntes = antes.json();
    expect(corpoAntes.status.status).toBe('sem_bu');
    expect(corpoAntes.boletim).toBeNull();
    expect(corpoAntes.resultados).toEqual([]);
    expect(corpoAntes.versoes_anteriores).toBe(0);

    const depois = await app.inject({
      method: 'GET',
      url: `/api/sections/${anterior.secao_id}?${base}&as_of=2026-01-01T13:00:00Z`,
    });
    expect(depois.statusCode).toBe(200);
    const corpoDepois = depois.json();
    expect(corpoDepois.status.status).toBe('bu_recebido');
    expect(corpoDepois.boletim.id).toBe(atual.id);
    expect(corpoDepois.resultados.length).toBe(resultados.length);

    const versoesAntes = await app.inject({
      method: 'GET',
      url: `/api/sections/${anterior.secao_id}/versions?${base}&as_of=2026-01-01T11:00:00Z`,
    });
    expect(versoesAntes.statusCode).toBe(200);
    const corpoVersoesAntes = versoesAntes.json();
    expect(corpoVersoesAntes.versoes).toHaveLength(1);
    expect(corpoVersoesAntes.versoes[0].id).toBe(anterior.id);
    expect(corpoVersoesAntes.comparacao).toBeNull();

    const versoesDepois = await app.inject({
      method: 'GET',
      url: `/api/sections/${anterior.secao_id}/versions?${base}&as_of=2026-01-01T13:00:00Z`,
    });
    expect(versoesDepois.statusCode).toBe(200);
    const corpoVersoesDepois = versoesDepois.json();
    expect(corpoVersoesDepois.versoes).toHaveLength(2);
    expect(corpoVersoesDepois.comparacao).toMatchObject({
      anterior: anterior.versao,
      atual: anterior.versao + 1,
    });
  });
});
