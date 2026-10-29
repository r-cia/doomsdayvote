import { sql } from 'kysely';
import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { validar } from '../lib/validar.js';
import { avisosCorte, corteResposta, metadadosCorte, resolverCorte } from '../modules/apuracao/corte.js';
import { contarSecoesComBu } from '../modules/apuracao/progresso.js';
import { classificarStatusSecao } from '../modules/apuracao/status-secao.js';
import { somarMetricasSecao, somarVotos, totaisPorArea } from '../modules/apuracao/totais.js';
import { baseSecaoCandidato, benfordDosNiveis, benfordPorCandidato, composicaoBiometria, featuresDasSecoes } from '../modules/analise/estatisticas.js';
import { duplicacaoPorAssinatura } from '../modules/analise/duplicacao.js';
import { FEATURES, amostraLof, isolationForest, localOutlierFactor } from '../modules/analise/outliers.js';

const corteSchema = {
  as_of: z.string().optional(),
  as_of_date: z.string().optional(),
};

const baseSchema = z.object({
  election_id: z.string().uuid(),
  cargo: z.coerce.number().int(),
  uf: z.string().length(2).optional(),
  municipio: z.coerce.number().int().optional(),
  ...corteSchema,
});

function escopoDe(query) {
  return { sgUf: query.uf, cdMunicipio: query.municipio };
}

async function buscarEleicao(db, id) {
  const eleicao = await db.selectFrom('eleicao').selectAll().where('id', '=', id).executeTakeFirst();
  if (!eleicao) throw new AppError('NOT_FOUND', 404, 'Eleição não encontrada');
  return eleicao;
}

function buDaSecao(linha) {
  if (!linha.bu_id) return null;
  return {
    cd_tipo_urna: linha.cd_tipo_urna,
    ds_tipo_urna: linha.ds_tipo_urna,
    precisao_dt_bu_recebido: linha.precisao_dt_bu_recebido,
    dt_abertura: linha.dt_abertura,
    dt_encerramento: linha.dt_encerramento,
    dt_emissao_bu: linha.dt_emissao_bu,
    dt_bu_recebido_ts: linha.dt_bu_recebido_ts,
    dt_bu_recebido_data: linha.dt_bu_recebido_data,
  };
}

function itemSecao(linha, corte) {
  const status = classificarStatusSecao(buDaSecao(linha), corte);
  return {
    id: linha.id,
    sg_uf: linha.sg_uf,
    cd_municipio_tse: linha.cd_municipio_tse,
    nm_municipio: linha.nm_municipio,
    nr_zona: linha.nr_zona,
    nr_secao: linha.nr_secao,
    nr_local_votacao: linha.nr_local_votacao,
    status: status.status,
    motivo: status.motivo,
    ...status.horarios,
  };
}

export async function registrarRotas(app) {
  const db = app.deps.db;
  const cache = app.deps.cache ?? {
    obter: async (_rota, _params, _ttl, fn) => ({ valor: await fn(), cache: 'off' }),
  };

  const cacheado = (rota, ttl, schema, fn) => async (req, reply) => {
    const query = validar(schema, { ...req.params, ...req.query });
    const { valor, cache: estado } = await cache.obter(rota, query, ttl, () => fn(query, req));
    reply.header('x-cache', estado);
    return valor;
  };

  app.get('/api/elections', cacheado('elections', 300, z.object({}), async () => {
    const eleicoes = await db
      .selectFrom('eleicao')
      .selectAll()
      .orderBy('ano_eleicao', 'desc')
      .orderBy('nr_turno', 'asc')
      .execute();

    const cargos = await db
      .selectFrom('boletim_versao')
      .select(['eleicao_id', 'cd_cargo_pergunta', 'ds_cargo_pergunta'])
      .where('ds_cargo_pergunta', 'in', ['Presidente', 'Governador'])
      .distinct()
      .execute();

    return {
      eleicoes: eleicoes.map((eleicao) => ({
        ...eleicao,
        cargos: cargos
          .filter((cargo) => cargo.eleicao_id === eleicao.id)
          .map((cargo) => ({
            cd_cargo_pergunta: cargo.cd_cargo_pergunta,
            ds_cargo_pergunta: cargo.ds_cargo_pergunta,
          })),
      })),
    };
  }));

  app.get('/api/summary', cacheado('summary', 60, baseSchema, async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };

    const [votos, metricas, secoes, metadados, avisos] = await Promise.all([
      somarVotos(db, escopo),
      somarMetricasSecao(db, escopo),
      contarSecoesComBu(db, escopo),
      metadadosCorte(db, escopo, corte),
      avisosCorte(db, escopo, corte),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      secoes_com_bu: secoes,
      votos,
      metricas,
    };
  }));

  app.get('/api/timeline', cacheado('timeline', 120, baseSchema.extend({
    granularity: z.enum(['1m', '5m']).default('5m'),
    por_candidato: z.enum(['true', 'false']).optional(),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const intervalo = query.granularity === '1m' ? '1 minute' : '5 minutes';
    const filtroUf = query.uf ? sql`and s.sg_uf = ${query.uf}` : sql``;
    const filtroMunicipio = query.municipio ? sql`and s.cd_municipio_tse = ${query.municipio}` : sql``;

    const { rows } = await sql`
      select
        date_bin(${intervalo}::interval, bv.dt_bu_recebido_ts, timestamptz '2000-01-01') as t,
        sum(rv.qt_votos) as votos,
        count(distinct bv.secao_id) as secoes
      from boletim_versao bv
      join resultado_votavel rv on rv.boletim_versao_id = bv.id
      join secao_eleitoral s on s.id = bv.secao_id
      where bv.ativo = true
        and bv.cd_tipo_urna = 1
        and bv.precisao_dt_bu_recebido = 'DATA_HORA'
        and bv.eleicao_id = ${eleicao.id}
        and bv.cd_cargo_pergunta = ${query.cargo}
        and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
        ${filtroUf}
        ${filtroMunicipio}
      group by 1
      order by 1
    `.execute(db);

    let votos = 0;
    let secoes = 0;
    const pontos = rows.map((linha) => {
      votos += Number(linha.votos);
      secoes += Number(linha.secoes);
      return {
        t: new Date(linha.t).toISOString(),
        votos_acumulados: votos,
        secoes_com_bu_acumuladas: secoes,
      };
    });

    let series = null;
    if (query.por_candidato === 'true') {
      const { rows: linhas } = await sql`
        select
          date_bin(${intervalo}::interval, bv.dt_bu_recebido_ts, timestamptz '2000-01-01') as t,
          rv.nr_votavel,
          max(rv.nm_votavel) as nm_votavel,
          sum(rv.qt_votos) as votos
        from boletim_versao bv
        join resultado_votavel rv on rv.boletim_versao_id = bv.id
        join secao_eleitoral s on s.id = bv.secao_id
        where bv.ativo = true
          and bv.cd_tipo_urna = 1
          and bv.precisao_dt_bu_recebido = 'DATA_HORA'
          and bv.eleicao_id = ${eleicao.id}
          and bv.cd_cargo_pergunta = ${query.cargo}
          and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
          and rv.categoria = 'nominal'
          and rv.qt_votos is not null
          ${filtroUf}
          ${filtroMunicipio}
        group by 1, 2
        order by 1, 2
      `.execute(db);

      const acumulado = new Map();
      for (const linha of linhas) {
        if (!acumulado.has(linha.nr_votavel)) {
          acumulado.set(linha.nr_votavel, {
            nr_votavel: linha.nr_votavel,
            nm_votavel: linha.nm_votavel,
            total: 0,
            pontos: [],
          });
        }
        const serie = acumulado.get(linha.nr_votavel);
        serie.total += Number(linha.votos);
        serie.pontos.push({
          t: new Date(linha.t).toISOString(),
          votos_acumulados: serie.total,
        });
      }

      series = [...acumulado.values()].map(({ total, ...serie }) => serie);
    }

    return {
      granularity: query.granularity,
      corte: corteResposta(corte),
      avisos:
        pontos.length > 0
          ? []
          : [
              {
                codigo: 'CORTE_INDISPONIVEL',
                mensagem: 'A fonte deste ano não permite linha do tempo por horário',
              },
            ],
      pontos,
      series,
    };
  }));

  app.get('/api/analysis', cacheado('analysis', 300, baseSchema, async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    };

    const [biometria, benford, metadados, avisos] = await Promise.all([
      composicaoBiometria(db, escopo),
      benfordPorCandidato(db, escopo),
      metadadosCorte(db, escopo, corte),
      avisosCorte(db, escopo, corte),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      biometria,
      benford: {
        minimo_votos: benford.minimo_votos,
        candidatos: benford.candidatos.map(({ niveis, ...candidato }) => ({
          ...candidato,
          ...niveis.secao,
        })),
      },
    };
  }));

  app.get('/api/anomalies', cacheado('anomalies', 600, baseSchema, async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    };

    const [linhas, duplicacao, metadados, avisos] = await Promise.all([
      baseSecaoCandidato(db, escopo),
      duplicacaoPorAssinatura(db, escopo),
      metadadosCorte(db, escopo, corte),
      avisosCorte(db, escopo, corte),
    ]);

    const benford = benfordDosNiveis(linhas);
    const secoes = featuresDasSecoes(linhas);
    const matriz = secoes.map((secao) =>
      FEATURES.map((feature) => secao[feature]),
    );
    const isolamento = isolationForest(matriz, { semente: 42 });
    const indices = amostraLof(secoes.length, isolamento.scores);
    const lof = localOutlierFactor(
      indices.map((indice) => matriz[indice]),
      { k: 10 },
    );
    const scoreLof = new Map(
      indices.map((indice, posicao) => [indice, lof.scores[posicao]]),
    );

    const ranking = secoes
      .map((secao, indice) => ({
        ...secao,
        score_if: isolamento.scores[indice],
        score_lof: scoreLof.get(indice) ?? null,
      }))
      .sort((a, b) => b.score_if - a.score_if)
      .slice(0, 20);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      benford_niveis: benford,
      duplicacao,
      outliers: {
        features: FEATURES,
        isolamento: {
          arvores: isolamento.arvores,
          amostra: isolamento.amostra,
          limiar: isolamento.limiar,
        },
        lof: {
          k: lof.k,
          amostra: indices.length,
          limitado: secoes.length > indices.length,
          limiar: lof.limiar,
        },
        total_secoes: secoes.length,
        secoes: ranking,
      },
    };
  }));

  app.get('/api/map', cacheado('map', 300, baseSchema.extend({
    level: z.enum(['uf', 'municipio']).default('uf'),
    candidatos: z.string().optional(),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const candidatos = (query.candidatos ?? '')
      .split(',')
      .map((valor) => Number(valor))
      .filter((valor) => Number.isInteger(valor));
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };

    const [areas, metadados, avisos] = await Promise.all([
      totaisPorArea(db, {
        eleicaoId: eleicao.id,
        cargo: query.cargo,
        corte,
        nivel: query.level,
        sgUf: query.uf,
        candidatos,
      }),
      metadadosCorte(db, escopo, corte),
      avisosCorte(db, escopo, corte),
    ]);

    return {
      level: query.level,
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      areas,
    };
  }));

  app.get('/api/sections', cacheado('sections', 60, baseSchema.extend({
    zona: z.coerce.number().int().optional(),
    secao: z.coerce.number().int().optional(),
    municipio_nome: z.string().optional(),
    busca: z.string().optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).optional(),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const padrao = app.config?.SECTIONS_PAGE_SIZE_DEFAULT ?? 50;
    const maximo = app.config?.SECTIONS_PAGE_SIZE_MAX ?? 200;
    const pageSize = Math.min(query.page_size ?? padrao, maximo);

    let consulta = db
      .selectFrom('secao_eleitoral as s')
      .innerJoin('localidade as l', (join) =>
        join
          .onRef('l.sg_uf', '=', 's.sg_uf')
          .onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .leftJoin('boletim_versao as bv', (join) =>
        join
          .onRef('bv.secao_id', '=', 's.id')
          .on('bv.eleicao_id', '=', eleicao.id)
          .on('bv.cd_cargo_pergunta', '=', query.cargo)
          .on('bv.ativo', '=', true),
      )
      .select([
        's.id',
        's.sg_uf',
        's.cd_municipio_tse',
        's.nr_zona',
        's.nr_secao',
        's.nr_local_votacao',
        'l.nm_municipio',
        sql`bv.id`.as('bu_id'),
        'bv.cd_tipo_urna',
        'bv.ds_tipo_urna',
        'bv.precisao_dt_bu_recebido',
        'bv.dt_abertura',
        'bv.dt_encerramento',
        'bv.dt_emissao_bu',
        'bv.dt_bu_recebido_ts',
        'bv.dt_bu_recebido_data',
      ])
      .where('s.ano_eleicao', '=', eleicao.ano_eleicao)
      .where('s.cd_pleito', '=', eleicao.cd_pleito)
      .where('s.nr_turno', '=', eleicao.nr_turno)
      .orderBy('s.sg_uf')
      .orderBy('s.cd_municipio_tse')
      .orderBy('s.nr_zona')
      .orderBy('s.nr_secao');

    if (query.uf) consulta = consulta.where('s.sg_uf', '=', query.uf);
    if (query.municipio) consulta = consulta.where('s.cd_municipio_tse', '=', query.municipio);
    if (query.zona) consulta = consulta.where('s.nr_zona', '=', query.zona);
    if (query.secao) consulta = consulta.where('s.nr_secao', '=', query.secao);
    if (query.municipio_nome) {
      consulta = consulta.where(sql`l.nm_municipio ilike ${`%${query.municipio_nome.trim()}%`}`);
    }
    if (query.busca) {
      const termo = query.busca.trim();
      consulta = consulta.where(sql`(
        l.nm_municipio ilike ${`%${termo}%`}
        or cast(s.nr_zona as text) = ${termo}
        or cast(s.nr_secao as text) = ${termo}
      )`);
    }

    const linhas = await consulta.execute();
    const itens = linhas
      .map((linha) => itemSecao(linha, corte))
      .filter((item) => (query.status ? item.status === query.status : true));

    const inicio = (query.page - 1) * pageSize;
    const [metadados, avisos] = await Promise.all([
      metadadosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
      avisosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      page: query.page,
      page_size: pageSize,
      total: itens.length,
      items: itens.slice(inicio, inicio + pageSize),
    };
  }));

  app.get('/api/sections/:id', cacheado('section', 300, z.object({
    id: z.string().uuid(),
    election_id: z.string().uuid(),
    cargo: z.coerce.number().int(),
    ...corteSchema,
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secao = await db
      .selectFrom('secao_eleitoral as s')
      .innerJoin('localidade as l', (join) =>
        join
          .onRef('l.sg_uf', '=', 's.sg_uf')
          .onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .select([
        's.id',
        's.sg_uf',
        's.cd_municipio_tse',
        's.nr_zona',
        's.nr_secao',
        's.nr_local_votacao',
        'l.nm_municipio',
      ])
      .where('s.id', '=', query.id)
      .executeTakeFirst();

    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const boletim = await db
      .selectFrom('boletim_versao')
      .selectAll()
      .where('secao_id', '=', query.id)
      .where('eleicao_id', '=', eleicao.id)
      .where('cd_cargo_pergunta', '=', query.cargo)
      .where('ativo', '=', true)
      .executeTakeFirst();

    const resultados = boletim
      ? await db
          .selectFrom('resultado_votavel')
          .selectAll()
          .where('boletim_versao_id', '=', boletim.id)
          .orderBy('qt_votos', 'desc')
          .execute()
      : [];

    const lote = boletim
      ? await db
          .selectFrom('lote_importacao')
          .select(['id', 'nome_arquivo', 'sha256'])
          .where('id', '=', boletim.lote_id)
          .executeTakeFirst()
      : null;

    const anteriores = boletim
      ? await db
          .selectFrom('boletim_versao')
          .select(({ fn }) => fn.countAll().as('total'))
          .where('secao_id', '=', query.id)
          .where('eleicao_id', '=', eleicao.id)
          .where('cd_cargo_pergunta', '=', query.cargo)
          .where('versao', '<', boletim.versao)
          .executeTakeFirstOrThrow()
      : { total: 0 };

    return {
      secao,
      status: classificarStatusSecao(boletim, corte),
      boletim,
      resultados,
      lote,
      versoes_anteriores: Number(anteriores.total),
    };
  }));
}
