import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { registrarRotas } from '../../src/routes/index.js';

function criarDbFalso(resultados) {
  const fila = resultados.map((linhas) => [...linhas]);

  const consulta = new Proxy(
    {
      execute: async () => fila.shift() ?? [],
      executeTakeFirst: async () => (fila.shift() ?? [])[0],
    },
    {
      get(alvo, propriedade) {
        if (propriedade in alvo) return alvo[propriedade];
        if (propriedade === 'then') return undefined;
        return () => consulta;
      },
    },
  );

  const executor = {
    transformQuery: (node) => node,
    compileQuery: () => ({}),
    executeQuery: async () => ({ rows: fila.shift() ?? [] }),
  };

  return {
    selectFrom: () => consulta,
    getExecutor: () => executor,
  };
}

function appCom(db) {
  return buildApp({
    deps: { db },
    config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
    rotas: registrarRotas,
  });
}

describe('API de totalização', () => {
  it('devolve o agregado do recorte com os números convertidos', async () => {
    const db = criarDbFalso([
      [
        {
          quantidade: 4,
          media_ms: 1500,
          mediana_ms: 1400,
          mais_rapido_ms: 900,
          mais_demora_ms: 2100,
          total: 5,
          falhou_1: 1,
          falhou_2: 0,
          falhou_3: 0,
          falhou_4: 1,
          manual: 0,
        },
      ],
      [{ total: 7 }],
      [{ secoes: 2, aptos: '300', comparecimento: '250', teclas_indevidas: '5', correcoes: '2' }],
    ]);

    const resposta = await appCom(db).inject({
      method: 'GET',
      url: '/api/totalizacao/metricas?ano=2026&turno=1&uf=RR',
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({
      escopo: 'uf',
      tempo: {
        quantidade: 4,
        mediaMs: 1500,
        medianaMs: 1400,
        maisRapidoMs: 900,
        maisDemoradoMs: 2100,
      },
      biometria: {
        falhou1: 1,
        falhou2: 0,
        falhou3: 0,
        falhou4: 1,
        manual: 0,
      },
      incidentes: { total: 7 },
      complementares: {
        secoes: 2,
        aptos: 300,
        comparecimento: 250,
        teclasIndevidas: 5,
        correcoes: 2,
      },
    });
  });

  it('exige ano e turno no recorte', async () => {
    const app = appCom(criarDbFalso([]));

    const semAno = await app.inject({ method: 'GET', url: '/api/totalizacao/metricas?turno=1' });
    expect(semAno.statusCode).toBe(400);
    expect(semAno.json().error.code).toBe('VALIDATION');
    expect(semAno.json().error.details[0].path).toBe('ano');

    const turnoInvalido = await app.inject({
      method: 'GET',
      url: '/api/totalizacao/metricas?ano=2026&turno=3',
    });
    expect(turnoInvalido.statusCode).toBe(400);
    expect(turnoInvalido.json().error.code).toBe('VALIDATION');
    expect(turnoInvalido.json().error.details[0].path).toBe('turno');
  });

  it('pagina os incidentes com o recorte aplicado', async () => {
    const instante = new Date('2026-10-04T12:00:00.000Z');
    const db = criarDbFalso([
      [
        {
          instante,
          nivel: 'ALERTA',
          tipo: 'URNA',
          texto_original: 'texto',
          sg_uf: 'RR',
          cd_municipio_tse: 3050,
          nr_zona: 3,
          nr_secao: 241,
        },
      ],
      [{ total: 12 }],
    ]);

    const resposta = await appCom(db).inject({
      method: 'GET',
      url: '/api/totalizacao/incidentes?ano=2026&turno=1&municipio=3050&pagina=2&tamanho=1',
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({
      itens: [
        {
          instante: '2026-10-04T12:00:00.000Z',
          nivel: 'ALERTA',
          tipo: 'URNA',
          texto_original: 'texto',
          sg_uf: 'RR',
          cd_municipio_tse: 3050,
          nr_zona: 3,
          nr_secao: 241,
        },
      ],
      total: 12,
      pagina: 2,
      tamanho: 1,
    });
  });

  it('lista divergências de todas as fontes e aceita filtro por fonte', async () => {
    const linha = {
      id: 1,
      lote_id: '00000000-0000-0000-0000-000000000001',
      fonte: 'rdv',
      campo: 'votos',
      sg_uf: 'RR',
      cd_municipio_tse: 3050,
      nr_zona: 3,
      nr_secao: 241,
      cd_cargo_pergunta: 1,
      nr_votavel: 13,
      valor_esperado: '192',
      valor_encontrado: '191',
      registrado_em: new Date('2026-10-04T12:00:00.000Z'),
    };

    const semFonte = await appCom(criarDbFalso([[linha], [{ total: 1 }]])).inject({
      method: 'GET',
      url: '/api/totalizacao/divergencias?ano=2026&turno=1',
    });

    expect(semFonte.statusCode).toBe(200);
    expect(semFonte.json().total).toBe(1);
    expect(semFonte.json().itens[0]).toEqual({
      ...linha,
      registrado_em: '2026-10-04T12:00:00.000Z',
    });

    const comFonte = await appCom(criarDbFalso([[], [{ total: 0 }]])).inject({
      method: 'GET',
      url: '/api/totalizacao/divergencias?ano=2026&turno=1&fonte=bweb',
    });

    expect(comFonte.statusCode).toBe(200);
    expect(comFonte.json()).toEqual({ itens: [], total: 0, pagina: 1, tamanho: 50 });
  });

  it('rejeita fonte fora das fontes de conferência', async () => {
    const resposta = await appCom(criarDbFalso([])).inject({
      method: 'GET',
      url: '/api/totalizacao/divergencias?ano=2026&turno=1&fonte=outra',
    });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().error.code).toBe('VALIDATION');
    expect(resposta.json().error.details[0].path).toBe('fonte');
  });
});
