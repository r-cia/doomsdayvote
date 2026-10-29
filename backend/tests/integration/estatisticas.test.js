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
let eleicaoPrimeiroTurno;

async function importar(nome) {
  return importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
}

describe('estatísticas descritivas', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-estatisticas-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    await importar('bweb_1t_AC_14102014131600.txt');
    await importar('bweb_2t_AC_28102014114450.txt');

    const linhas = await db
      .selectFrom('boletim_versao as bv')
      .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
      .select(['bv.eleicao_id', 'e.nr_turno', 'bv.cd_cargo_pergunta'])
      .where('e.ano_eleicao', '=', 2014)
      .where('bv.ativo', '=', true)
      .where('bv.cd_tipo_urna', '=', 1)
      .distinct()
      .execute();

    const porTurno = new Map();
    for (const linha of linhas) {
      const chave = `${linha.cd_cargo_pergunta}:${linha.nr_turno}`;
      porTurno.set(chave, linha.eleicao_id);
    }

    const comuns = linhas
      .filter(
        (linha) =>
          linha.nr_turno === 1 &&
          porTurno.has(`${linha.cd_cargo_pergunta}:2`),
      )
      .map((linha) => linha.cd_cargo_pergunta);

    expect(comuns.length).toBeGreaterThan(0);
    cargo = comuns[0];
    eleicaoPrimeiroTurno = porTurno.get(`${cargo}:1`);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('devolve dois blocos lado a lado quando o ano tem dois turnos', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/estatisticas?election_id=${eleicaoPrimeiroTurno}&cargo=${cargo}&escopo=ano`,
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.escopo).toBe('ano');
    expect(corpo.turnos_disponiveis).toEqual([1, 2]);
    expect(corpo.blocos.map((bloco) => bloco.nr_turno)).toEqual([1, 2]);

    for (const bloco of corpo.blocos) {
      expect(bloco.ano_eleicao).toBe(2014);
      expect(bloco.comparecimento.secoes).toBeGreaterThan(0);
      expect(bloco.comparecimento.media).toBeGreaterThan(0);
      expect(bloco.comparecimento.mediana).toBeGreaterThan(0);
      expect(bloco.comparecimento.desvio).toBeGreaterThanOrEqual(0);
      expect(bloco.candidatos.length).toBeGreaterThan(0);

      const medias = bloco.candidatos.map((candidato) => candidato.media);
      expect(medias).toEqual([...medias].sort((a, b) => b - a));

      for (const candidato of bloco.candidatos) {
        expect(candidato.secoes).toBeGreaterThan(0);
        expect(candidato.media).toBeGreaterThanOrEqual(0);
        expect(candidato.mediana).toBeGreaterThanOrEqual(0);
        expect(candidato.desvio).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('mantém média e contagem coerentes com o resumo do turno', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/estatisticas?election_id=${eleicaoPrimeiroTurno}&cargo=${cargo}&escopo=ano`,
    });
    const { blocos } = resposta.json();

    for (const bloco of blocos) {
      const resumo = await app.inject({
        method: 'GET',
        url: `/api/summary?election_id=${bloco.eleicao_id}&cargo=${cargo}`,
      });
      const dados = resumo.json();

      for (const candidato of bloco.candidatos) {
        const linha = dados.votos.find(
          (voto) =>
            voto.categoria === 'nominal' &&
            voto.nr_votavel === candidato.nr_votavel,
        );
        expect(linha).toBeDefined();
        expect(candidato.media * candidato.secoes).toBeCloseTo(
          Number(linha.qt_votos),
          1,
        );
      }

      if (dados.metricas.bus_considerados === bloco.comparecimento.secoes) {
        expect(bloco.comparecimento.media * bloco.comparecimento.secoes).toBeCloseTo(
          dados.metricas.qt_comparecimento,
          1,
        );
      }
    }
  });

  it('no escopo de turno devolve só a eleição pedida', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/estatisticas?election_id=${eleicaoPrimeiroTurno}&cargo=${cargo}`,
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.escopo).toBe('turno');
    expect(corpo.turnos_disponiveis).toEqual([1, 2]);
    expect(corpo.blocos).toHaveLength(1);
    expect(corpo.blocos[0].nr_turno).toBe(1);
    expect(corpo.blocos[0].eleicao_id).toBe(eleicaoPrimeiroTurno);
  });

  it('recusa escopo desconhecido', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/estatisticas?election_id=${eleicaoPrimeiroTurno}&cargo=${cargo}&escopo=zona`,
    });

    expect(resposta.statusCode).toBe(400);
  });
});
