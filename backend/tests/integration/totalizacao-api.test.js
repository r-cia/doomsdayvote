import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { carregarZip } from '../../src/modules/totalizacao/carga.js';
import { registrarDivergencias } from '../../src/modules/totalizacao/divergencias.js';
import { registrarRotas } from '../../src/routes/index.js';
import {
  CENARIO,
  gerarBu,
  gerarLogJez,
  gerarRdv,
  gerarZip,
  votosDoCenario,
} from '../helpers/dados-sinteticos.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

const UF = CENARIO.uf;
const MUNICIPIO = CENARIO.municipio;
const ANO = CENARIO.ano;
const TURNO = CENARIO.turno;
const PREFIXO = 'ac9999z1010001';
const NOME_ZIP = 'bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip';

const COLUNAS_DIVERGENCIA = [
  'id',
  'lote_id',
  'fonte',
  'campo',
  'sg_uf',
  'cd_municipio_tse',
  'nr_zona',
  'nr_secao',
  'cd_cargo_pergunta',
  'nr_votavel',
  'valor_esperado',
  'valor_encontrado',
  'registrado_em',
];

let diretorio;
let loteId;

async function limpar() {
  await db.deleteFrom('totalizacao_divergencia').where('sg_uf', '=', UF).execute();

  const linhas = await db
    .selectFrom('totalizacao_secao')
    .select('id')
    .where('sg_uf', '=', UF)
    .where('ano_eleicao', '=', ANO)
    .execute();
  const ids = linhas.map((linha) => linha.id);

  if (ids.length > 0) {
    await db.deleteFrom('totalizacao_incidente').where('totalizacao_secao_id', 'in', ids).execute();
    await db.deleteFrom('totalizacao_eleitor').where('totalizacao_secao_id', 'in', ids).execute();
    await db.deleteFrom('totalizacao_secao').where('id', 'in', ids).execute();
  }

  await db.deleteFrom('totalizacao_lote').where('sg_uf', '=', UF).where('ano_eleicao', '=', ANO).execute();
  await db.deleteFrom('localidade').where('sg_uf', '=', UF).where('cd_municipio_tse', '=', MUNICIPIO).execute();
}

async function semear() {
  await limpar();

  diretorio = await mkdtemp(path.join(tmpdir(), 'totalizacao-api-'));
  const caminho = path.join(diretorio, NOME_ZIP);
  await writeFile(
    caminho,
    gerarZip([
      [`${PREFIXO}-bu.dat`, gerarBu()],
      [`${PREFIXO}-rdv.dat`, gerarRdv({ votos: votosDoCenario() })],
      [`${PREFIXO}-log.jez`, gerarLogJez()],
    ]),
  );

  const resultado = await carregarZip(db, caminho);
  loteId = resultado.lote_id;

  await registrarDivergencias(db, loteId, [
    {
      fonte: 'rdv',
      campo: 'votos',
      sg_uf: UF,
      cd_municipio_tse: MUNICIPIO,
      nr_zona: CENARIO.zona,
      nr_secao: CENARIO.secao,
      cd_cargo_pergunta: 1,
      nr_votavel: 13,
      valor_esperado: '1',
      valor_encontrado: '0',
    },
    {
      fonte: 'log',
      campo: 'biometria',
      sg_uf: UF,
      cd_municipio_tse: MUNICIPIO,
      nr_zona: CENARIO.zona,
      nr_secao: CENARIO.secao,
      valor_esperado: '3',
      valor_encontrado: '2',
    },
  ]);
}

describe('API de totalização', () => {
  beforeAll(async () => {
    await semear();
  }, 60000);

  afterAll(async () => {
    await limpar();
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it('devolve o agregado do recorte em /api/totalizacao/metricas', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/metricas?ano=${ANO}&turno=${TURNO}&uf=${UF}&municipio=${MUNICIPIO}`,
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({
      tempo: {
        quantidade: 3,
        mediaMs: 20000,
        medianaMs: 20000,
        maisRapidoMs: 10000,
        maisDemoradoMs: 30000,
      },
      biometria: {
        falhou1: 1,
        falhou2: 1,
        falhou3: 0,
        falhou4: 0,
        manual: 0,
      },
      incidentes: { total: 1 },
      complementares: {
        secoes: 1,
        aptos: CENARIO.aptos,
        comparecimento: CENARIO.comparecimento,
        teclasIndevidas: 1,
        correcoes: 1,
      },
    });
  });

  it('rejeita recorte sem ano ou com turno fora de 1 e 2', async () => {
    const semAno = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/metricas?turno=${TURNO}&uf=${UF}`,
    });
    expect(semAno.statusCode).toBe(400);
    expect(semAno.json().error.code).toBe('VALIDATION');
    expect(semAno.json().error.details[0].path).toBe('ano');

    const turnoInvalido = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/metricas?ano=${ANO}&turno=3&uf=${UF}`,
    });
    expect(turnoInvalido.statusCode).toBe(400);
    expect(turnoInvalido.json().error.details[0].path).toBe('turno');
  });

  it('pagina os incidentes do recorte', async () => {
    const primeira = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/incidentes?ano=${ANO}&turno=${TURNO}&uf=${UF}&pagina=1&tamanho=1`,
    });

    expect(primeira.statusCode).toBe(200);
    expect(primeira.json()).toEqual({
      itens: [
        {
          instante: '2026-10-04T07:05:00.000Z',
          nivel: 'ALERTA',
          tipo: 'desconhecido',
          texto_original: CENARIO.incidente.texto,
          sg_uf: UF,
          cd_municipio_tse: MUNICIPIO,
          nr_zona: CENARIO.zona,
          nr_secao: CENARIO.secao,
        },
      ],
      total: 1,
      pagina: 1,
      tamanho: 1,
    });

    const segunda = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/incidentes?ano=${ANO}&turno=${TURNO}&uf=${UF}&pagina=2&tamanho=1`,
    });

    expect(segunda.statusCode).toBe(200);
    expect(segunda.json().itens).toEqual([]);
    expect(segunda.json().total).toBe(1);
  });

  it('lista divergências de todas as fontes e filtra por fonte', async () => {
    const todas = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/divergencias?ano=${ANO}&turno=${TURNO}&uf=${UF}`,
    });

    expect(todas.statusCode).toBe(200);
    expect(todas.json().total).toBe(3);
    expect(todas.json().itens.map((item) => item.fonte).sort()).toEqual(['bweb', 'log', 'rdv']);
    for (const item of todas.json().itens) {
      expect(Object.keys(item).sort()).toEqual([...COLUNAS_DIVERGENCIA].sort());
    }

    const apenasLog = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/divergencias?ano=${ANO}&turno=${TURNO}&uf=${UF}&fonte=log`,
    });

    expect(apenasLog.statusCode).toBe(200);
    expect(apenasLog.json().total).toBe(1);
    expect(apenasLog.json().itens[0]).toMatchObject({
      fonte: 'log',
      campo: 'biometria',
      cd_cargo_pergunta: null,
      nr_votavel: null,
      valor_esperado: '3',
      valor_encontrado: '2',
    });
  });

  it('rejeita fonte fora das fontes de conferência', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: `/api/totalizacao/divergencias?ano=${ANO}&turno=${TURNO}&uf=${UF}&fonte=outra`,
    });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().error.code).toBe('VALIDATION');
    expect(resposta.json().error.details[0].path).toBe('fonte');
  });
});
