import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { REGRAS, consistenciaPorSecao, validarConsistenciaBu } from '../../src/modules/analise/consistencia.js';
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

  it('o caminho SQL e validarConsistenciaBu concordam em status e diferença, inclusive com dados insuficientes', async () => {
    const bus = await db
      .selectFrom('boletim_versao')
      .select(['id', 'qt_aptos', 'qt_comparecimento', 'qt_abstencoes', 'qt_elei_biom_sem_habilitacao'])
      .where('eleicao_id', '=', eleicao)
      .where('cd_cargo_pergunta', '=', cargo)
      .where('ativo', '=', true)
      .where('cd_tipo_urna', '=', 1)
      .orderBy('id')
      .limit(8)
      .execute();
    expect(bus.length).toBeGreaterThanOrEqual(6);

    const variacoes = [
      {},
      { qt_comparecimento: null },
      { qt_aptos: null },
      { qt_abstencoes: null },
      { qt_elei_biom_sem_habilitacao: null },
      { qt_comparecimento: 999999, qt_elei_biom_sem_habilitacao: 1000000 },
    ];
    for (const [indice, variacao] of variacoes.entries()) {
      if (Object.keys(variacao).length === 0) continue;
      await db.updateTable('boletim_versao').set(variacao).where('id', '=', bus[indice].id).execute();
    }
    await db.deleteFrom('resultado_votavel').where('boletim_versao_id', '=', bus[1].id).execute();
    await db
      .updateTable('resultado_votavel')
      .set({ qt_votos: null })
      .where('id', 'in', db.selectFrom('resultado_votavel').select('id').where('boletim_versao_id', '=', bus[2].id).limit(1))
      .execute();

    const resposta = await consistenciaPorSecao(db, { eleicaoId: eleicao, cargo, limite: 100000, deslocamento: 0 });

    const atuais = await db
      .selectFrom('boletim_versao')
      .select(['id', 'qt_aptos', 'qt_comparecimento', 'qt_abstencoes', 'qt_elei_biom_sem_habilitacao'])
      .where('eleicao_id', '=', eleicao)
      .where('cd_cargo_pergunta', '=', cargo)
      .where('ativo', '=', true)
      .where('cd_tipo_urna', '=', 1)
      .execute();
    const resultados = await db
      .selectFrom('resultado_votavel')
      .select(['boletim_versao_id', 'qt_votos'])
      .where('boletim_versao_id', 'in', atuais.map((bu) => bu.id))
      .execute();
    const porBu = new Map();
    for (const item of resultados) {
      if (!porBu.has(item.boletim_versao_id)) porBu.set(item.boletim_versao_id, []);
      porBu.get(item.boletim_versao_id).push(item);
    }

    const esperadoDivergencias = new Map();
    const esperadoSemCampo = Object.fromEntries(REGRAS.map((regra) => [regra, 0]));
    let avaliadas = 0;
    let comDivergencia = 0;
    for (const bu of atuais) {
      const regras = validarConsistenciaBu(bu, porBu.get(bu.id) ?? []);
      let avaliavel = false;
      let divergente = false;
      for (const regra of regras) {
        if (regra.status === 'dados_insuficientes') {
          esperadoSemCampo[regra.regra] += 1;
          continue;
        }
        avaliavel = true;
        if (regra.status === 'divergente') {
          divergente = true;
          esperadoDivergencias.set(`${bu.id}|${regra.regra}`, regra);
        }
      }
      if (avaliavel) avaliadas += 1;
      if (divergente) comDivergencia += 1;
    }

    expect(esperadoDivergencias.size).toBeGreaterThan(0);
    expect(Object.values(esperadoSemCampo).some((n) => n > 0)).toBe(true);
    expect(resposta.cobertura.consideradas).toBe(atuais.length);
    expect(resposta.cobertura.avaliadas).toBe(avaliadas);
    expect(resposta.cobertura.com_divergencia).toBe(comDivergencia);
    expect(resposta.cobertura.sem_campo_por_regra).toEqual(esperadoSemCampo);
    expect(resposta.total).toBe(esperadoDivergencias.size);
    expect(resposta.itens).toHaveLength(esperadoDivergencias.size);
    for (const item of resposta.itens) {
      const esperado = esperadoDivergencias.get(`${item.bu.id}|${item.regra}`);
      expect(esperado, `${item.bu.id} ${item.regra}`).toBeDefined();
      expect(item.diferenca).toBe(esperado.diferenca);
      expect(item.campos).toEqual(esperado.campos);
      expect(item.valores).toEqual(esperado.valores);
    }
  });

  it('pagina e ordena no banco, com ordem padrão determinística', async () => {
    const base = `/api/consistencia?election_id=${eleicao}&cargo=${cargo}`;
    const completa = (await app.inject({ method: 'GET', url: `${base}&page_size=200` })).json();
    const pagina2 = (await app.inject({ method: 'GET', url: `${base}&page_size=1&page=2` })).json();
    expect(pagina2.total).toBe(completa.total);
    if (completa.total >= 2) expect(pagina2.itens[0]).toEqual(completa.itens[1]);

    const desc = (await app.inject({ method: 'GET', url: `${base}&page_size=200&ordem=diferenca&direcao=desc` })).json();
    const diferencas = desc.itens.map((item) => item.diferenca);
    expect(diferencas).toEqual([...diferencas].sort((a, b) => b - a));
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