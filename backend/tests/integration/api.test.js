import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { registrarRotas } from '../../src/routes/index.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { CENARIO, NOME_2026, escreverArquivo, gerarBwebMulti, secoes2026 } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

const SECOES = 12;
let diretorio;
let alvo;

async function importar(nome, conteudo) {
  const caminho = await escreverArquivo(diretorio, nome, conteudo);
  const resultado = await importarArquivo({ db, caminho, nomeArquivo: nome });
  await atualizarViews(db);
  return resultado;
}

describe('API de leitura', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-api-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    await importar(
      NOME_2026,
      gerarBwebMulti(secoes2026(SECOES, { nomeMunicipio: 'RIO BRANCO' })),
    );
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
    await rm(diretorio, { recursive: true, force: true });
  });

  it(
    'lista eleições, resumo e linha do tempo',
    async () => {
      const eleicoes = await app.inject({ method: 'GET', url: '/api/elections' });
      expect(eleicoes.statusCode).toBe(200);
      expect(eleicoes.json().eleicoes.length).toBeGreaterThan(0);
      expect(eleicoes.headers['x-cache']).toBe('off');

      const resumo = await app.inject({
        method: 'GET',
        url: `/api/summary?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(resumo.statusCode).toBe(200);
      const corpo = resumo.json();
      expect(corpo.secoes_com_bu).toBe(SECOES);
      expect(corpo.votos.length).toBeGreaterThan(0);
      expect(corpo.metricas.bus_considerados).toBe(SECOES);

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
  );

  it(
    'lista cargo em maiúsculas na eleição',
    async () => {
      const base = await db.selectFrom('boletim_versao').selectAll().executeTakeFirstOrThrow();
      await db
        .insertInto('boletim_versao')
        .values({
          ...base,
          id: randomUUID(),
          cd_cargo_pergunta: 9,
          ds_cargo_pergunta: 'PRESIDENTE',
        })
        .execute();

      const eleicoes = await app.inject({ method: 'GET', url: '/api/elections' });
      expect(eleicoes.statusCode).toBe(200);
      const eleicao = eleicoes.json().eleicoes.find((item) => item.id === base.eleicao_id);
      expect(eleicao).toBeTruthy();
      expect(eleicao.cargos).toContainEqual({ cd_cargo_pergunta: 9, ds_cargo_pergunta: 'PRESIDENTE' });
    },
  );

  it(
    'mapa, seções e detalhe',
    async () => {
      const mapa = await app.inject({
        method: 'GET',
        url: `/api/map?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&level=uf`,
      });
      expect(mapa.statusCode).toBe(200);
      expect(mapa.json().areas.length).toBe(1);

      const secoes = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&status=bu_recebido&page=1&page_size=10`,
      });
      expect(secoes.statusCode).toBe(200);
      const corpo = secoes.json();
      expect(corpo.total).toBe(SECOES);
      expect(corpo.items).toHaveLength(10);

      const busca = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&busca=rio`,
      });
      expect(busca.json().total).toBe(SECOES);

      const detalhe = await app.inject({
        method: 'GET',
        url: `/api/sections/${corpo.items[0].id}?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(detalhe.statusCode).toBe(200);
      expect(detalhe.json().secao.id).toBe(corpo.items[0].id);
      expect(detalhe.json().boletim).toBeTruthy();

      const primeiro = corpo.items[0];
      const porSecao = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&uf=${CENARIO.uf}&zona=${primeiro.nr_zona}&secao=${primeiro.nr_secao}`,
      });
      expect(porSecao.statusCode).toBe(200);
      expect(porSecao.json().items).toHaveLength(1);

      const porMunicipio = await app.inject({
        method: 'GET',
        url: `/api/sections?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&uf=${CENARIO.uf}&municipio_nome=${encodeURIComponent(primeiro.nm_municipio)}`,
      });
      expect(porMunicipio.statusCode).toBe(200);
      expect(porMunicipio.json().total).toBe(SECOES);
    },
  );

  it(
    'análise: biometria do recorte e Benford por candidato',
    async () => {
      const analise = await app.inject({
        method: 'GET',
        url: `/api/analysis?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(analise.statusCode).toBe(200);
      const corpo = analise.json();

      expect(corpo.biometria.secoes).toBe(SECOES);
      expect(corpo.biometria.qt_comparecimento).toBeGreaterThanOrEqual(0);
      expect(
        corpo.biometria.qt_habilitados_por_biometria +
          corpo.biometria.qt_biometria_nao_habilitada,
      ).toBe(corpo.biometria.qt_comparecimento);

      expect(corpo.benford.minimo_votos).toBe(10);
      expect(corpo.benford.candidatos.length).toBeGreaterThan(0);
      const candidato = corpo.benford.candidatos[0];
      expect(candidato.digitos).toHaveLength(9);
      expect(candidato.n).toBeGreaterThanOrEqual(0);
      if (candidato.n > 0) {
        const total = candidato.digitos.reduce(
          (soma, digito) => soma + digito.observado,
          0,
        );
        expect(total).toBe(candidato.n);
      }

      const semCorte = await app.inject({
        method: 'GET',
        url: `/api/analysis?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&as_of=2026-10-04T17:08:43-03:00`,
      });
      expect(semCorte.statusCode).toBe(200);
      expect(semCorte.json().biometria.secoes).toBe(0);

      const series = await app.inject({
        method: 'GET',
        url: `/api/timeline?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}&por_candidato=true`,
      });
      expect(series.statusCode).toBe(200);
      const corpoSeries = series.json();
      expect(corpoSeries.series.length).toBeGreaterThan(0);
      expect(corpoSeries.series[0].pontos.length).toBeGreaterThan(0);
      expect(corpoSeries.series[0].pontos[0].votos_acumulados).toBeGreaterThan(0);
    },
  );

  it(
    'anomalias: Benford por nível, duplicação e outliers',
    async () => {
      const resposta = await app.inject({
        method: 'GET',
        url: `/api/anomalies?election_id=${alvo.eleicaoId}&cargo=${alvo.cargo}`,
      });
      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json();

      expect(corpo.benford_niveis.minimo_votos).toBe(10);
      const candidato = corpo.benford_niveis.candidatos[0];
      expect(candidato.niveis.secao.digitos).toHaveLength(9);
      expect(candidato.niveis.zona.digitos).toHaveLength(9);
      expect(candidato.niveis.municipio.digitos).toHaveLength(9);

      expect(corpo.duplicacao.total_grupos).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(corpo.duplicacao.grupos)).toBe(true);

      expect(corpo.outliers.features).toHaveLength(6);
      expect(corpo.outliers.total_secoes).toBe(SECOES);
      expect(corpo.outliers.secoes.length).toBeGreaterThan(0);
      expect(corpo.outliers.secoes[0].score_if).toBeGreaterThanOrEqual(0);
      expect(corpo.outliers.secoes[0].score_if).toBeLessThanOrEqual(1);
    },
  );
});
