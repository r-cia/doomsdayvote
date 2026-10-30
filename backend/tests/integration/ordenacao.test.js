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
let base;
let uf;

async function obter(rota, parametros = '') {
  return app.inject({ method: 'GET', url: `${rota}?${base}${parametros}` });
}

async function json(rota, parametros = '') {
  const resposta = await obter(rota, parametros);
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

describe('ordenação no servidor', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-ordenacao-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    const nome = 'bweb_1t_AC_101020181938.csv';
    await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
    const linha = await db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .select(['bv.eleicao_id', 'bv.cd_cargo_pergunta', 's.sg_uf'])
      .where('bv.ativo', '=', true)
      .where('bv.cd_tipo_urna', '=', 1)
      .executeTakeFirst();
    base = `election_id=${linha.eleicao_id}&cargo=${linha.cd_cargo_pergunta}`;
    uf = linha.sg_uf;
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('rejeita coluna fora da lista e direção inválida com 400 VALIDATION', async () => {
    for (const rota of ['/api/sections', '/api/summary', '/api/map', '/api/anomalies', '/api/consistencia', '/api/relatorio']) {
      const resposta = await obter(rota, '&ordem=inexistente');
      expect(resposta.statusCode).toBe(400);
      expect(resposta.json().error?.code ?? resposta.json().code).toBe('VALIDATION');
    }
    expect((await obter('/api/sections', '&ordem=nr_secao&direcao=up')).statusCode).toBe(400);
    expect((await obter('/api/concentracao', '&ordem_share=inexistente')).statusCode).toBe(400);
  });

  it('mapa: devolve lider_nome e ordena por líder e por candidato selecionado', async () => {
    const nome = 'bweb-1t_ac_2026.csv';
    await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
    const alvo = await db
      .selectFrom('boletim_versao as bv')
      .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
      .select(['bv.eleicao_id', 'bv.cd_cargo_pergunta'])
      .where('e.ano_eleicao', '=', 2026)
      .where('bv.ativo', '=', true)
      .executeTakeFirst();
    const mapa = `/api/map?election_id=${alvo.eleicao_id}&cargo=${alvo.cd_cargo_pergunta}&as_of=2026-10-04T23:59:59-03:00&level=municipio`;
    const buscar = async (extra = '') => {
      const resposta = await app.inject({ method: 'GET', url: `${mapa}${extra}` });
      expect(resposta.statusCode).toBe(200);
      return resposta.json().areas;
    };

    const areas = await buscar();
    expect(areas.length).toBeGreaterThan(0);
    const nomes = (await buscar('&ordem=lider_nome&direcao=asc')).map((a) => a.lider_nome);
    const comNome = nomes.filter((n) => n !== null);
    expect(comNome.length).toBeGreaterThan(0);
    expect(nomes.length).toBe(areas.length);
    expect(comNome).toEqual([...comNome].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(nomes.slice(0, comNome.length)).toEqual(comNome);

    const nr = areas.find((a) => a.lider).lider.nr_votavel;
    const sel = await buscar(`&candidatos=${nr}&ordem=candidato_votos&direcao=desc`);
    const votos = sel.map((a) => a.candidato_votos).filter((v) => v !== null);
    expect(votos.length).toBeGreaterThan(0);
    expect(votos).toEqual([...votos].sort((a, b) => b - a));
    expect(sel[0].candidato_percentual).not.toBeNull();
    expect((await buscar('&ordem=candidato_percentual&direcao=asc')).every((a) => a.candidato_votos === null)).toBe(true);
  });

  it('seções: ordena asc e desc sobre todo o conjunto antes da paginação', async () => {
    const padrao = await json('/api/sections', '&page_size=200');
    const chaves = padrao.items.map((i) => [i.cd_municipio_tse, i.nr_zona, i.nr_secao]);
    expect(chaves).toEqual([...chaves].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]));

    const maximo = await db.selectFrom('secao_eleitoral').select((eb) => eb.fn.max('nr_secao').as('m')).executeTakeFirst();
    const desc = await json('/api/sections', '&ordem=nr_secao&direcao=desc&page_size=5');
    expect(desc.items[0].nr_secao).toBe(maximo.m);
    const secoes = desc.items.map((i) => i.nr_secao);
    expect(secoes).toEqual([...secoes].sort((a, b) => b - a));

    const asc = await json('/api/sections', '&ordem=nr_secao&direcao=asc&page_size=5');
    const seqAsc = asc.items.map((i) => i.nr_secao);
    expect(seqAsc).toEqual([...seqAsc].sort((a, b) => a - b));
  });

  it('resumo: ordena votos por coluna permitida e mantém o padrão sem ordem', async () => {
    const padrao = (await json('/api/summary')).votos.map((v) => v.qt_votos);
    expect(padrao).toEqual([...padrao].sort((a, b) => b - a));
    const asc = (await json('/api/summary', '&ordem=qt_votos&direcao=asc')).votos.map((v) => v.qt_votos);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
  });

  it('encerramento/municípios: top-N respeita a coluna pedida e o padrão não muda', async () => {
    const todos = (await json('/api/encerramento/municipios', `&uf=${uf}&limit=100`)).municipios;
    const padrao = await json('/api/encerramento/municipios', `&uf=${uf}&limit=100&ordem=pct_apos_1715&direcao=desc`);
    expect(padrao.municipios.map((m) => m.cd_municipio_tse)).toEqual(todos.map((m) => m.cd_municipio_tse));

    const topTotal = await json('/api/encerramento/municipios', `&uf=${uf}&limit=1&ordem=total&direcao=desc`);
    expect(topTotal.municipios[0].total).toBe(Math.max(...todos.map((m) => m.total)));

    const topVotos = await json('/api/encerramento/municipios', `&uf=${uf}&limit=1&ordem=votos&direcao=desc`);
    expect(topVotos.municipios[0].votos).toBe(Math.max(...todos.map((m) => m.votos)));
  });

  it('biometria/municípios: ordena por coluna antes do limite', async () => {
    const todos = (await json('/api/biometria/municipios', `&uf=${uf}&limit=100`)).municipios;
    const top = await json('/api/biometria/municipios', `&uf=${uf}&limit=1&ordem=qt_comparecimento&direcao=desc`);
    expect(top.municipios[0].qt_comparecimento).toBe(Math.max(...todos.map((m) => m.qt_comparecimento)));
    const menor = await json('/api/biometria/municipios', `&uf=${uf}&limit=1&ordem=qt_comparecimento&direcao=asc`);
    expect(menor.municipios[0].qt_comparecimento).toBe(Math.min(...todos.map((m) => m.qt_comparecimento)));
  });

  it('concentração: top-N por coluna escolhida sai de todas as seções', async () => {
    const completo = await json('/api/concentracao', '&limit=100');
    const comShare = completo.secoes.filter((s) => s.share_lider !== null).map((s) => s.secao.nr_secao);
    const menorSecao = Math.min(...comShare);
    const resposta = await json('/api/concentracao', '&limit=3&ordem_share=nr_secao&direcao_share=asc');
    expect(resposta.top_share[0].secao.nr_secao).toBe(menorSecao);
    expect(resposta.top_margem.length).toBe(completo.top_margem.slice(0, 3).length);
    expect(resposta.top_margem.map((i) => i.secao.id)).toEqual(completo.top_margem.slice(0, 3).map((i) => i.secao.id));
  });

  it('anomalias: ordena os outliers por score_lof desc com nulos por último', async () => {
    const corpo = await json('/api/anomalies', '&ordem=score_lof&direcao=desc');
    const lof = corpo.outliers.secoes.map((s) => s.score_lof);
    const comValor = lof.filter((v) => v !== null);
    expect(comValor).toEqual([...comValor].sort((a, b) => b - a));
    expect(lof.slice(0, comValor.length)).toEqual(comValor);

    const padrao = (await json('/api/anomalies')).outliers.secoes.map((s) => s.score_if);
    expect(padrao).toEqual([...padrao].sort((a, b) => b - a));
  });
});
