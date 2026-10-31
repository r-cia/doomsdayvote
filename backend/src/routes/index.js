import { sql } from 'kysely';
import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { validar } from '../lib/validar.js';
import { CARGO_EM_ESCOPO, aplicarEscopo, aplicarFiltroCorte, avisosCorte, corteResposta, metadadosCorte, resolverCorte } from '../modules/apuracao/corte.js';
import { contarSecoesComBu } from '../modules/apuracao/progresso.js';
import { horariosDoBu } from '../modules/apuracao/status-secao.js';
import { somarMetricasSecao, somarVotos, totaisPorArea } from '../modules/apuracao/totais.js';
import { baseSecaoCandidato, benfordDosNiveis, benfordPorCandidato, biometriaPorUf, composicaoBiometria, featuresDasSecoes } from '../modules/analise/estatisticas.js';
import { eleicoesDoAno, estatisticasDaEleicao } from '../modules/analise/descritivas.js';
import { COLUNAS_DUPLICACAO, duplicacaoPorAssinatura } from '../modules/analise/duplicacao.js';
import { consistenciaPorSecao, validarConsistenciaBu } from '../modules/analise/consistencia.js';
import { compararVersoes } from '../modules/analise/versoes-bu.js';
import { comparacaoLocal } from '../modules/analise/comparacao-local.js';
import { COLUNAS_CONCENTRACAO, concentracao } from '../modules/analise/concentracao.js';
import { FEATURES, amostraLof, isolationForest, localOutlierFactor } from '../modules/analise/outliers.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista, ordenarSql } from '../lib/ordenacao.js';

const COLUNAS_VOTOS = {
  nm_votavel: (v) => v.nm_votavel,
  sg_partido: (v) => v.sg_partido,
  qt_votos: (v) => v.qt_votos,
  percentual: (v) => v.percentual,
};

const COLUNAS_MAPA = {
  sg_uf: (a) => a.sg_uf,
  nm_municipio: (a) => a.nm_municipio,
  total_votos: (a) => a.total_votos,
  votos_validos: (a) => a.votos_validos,
  lider_percentual: (a) => a.lider?.percentual,
  lider_nome: (a) => a.lider_nome,
  candidato_votos: (a) => a.candidato_votos,
  candidato_percentual: (a) => a.candidato_percentual,
};

const COLUNAS_BENFORD = {
  nm_votavel: (c) => c.nm_votavel,
  n: (c) => c.n,
  mad: (c) => c.mad,
};

const COLUNAS_BENFORD_NIVEIS = {
  nm_votavel: (c) => c.nm_votavel,
  secao_n: (c) => c.niveis.secao.n,
  secao_mad: (c) => c.niveis.secao.mad,
  zona_n: (c) => c.niveis.zona.n,
  zona_mad: (c) => c.niveis.zona.mad,
  municipio_n: (c) => c.niveis.municipio.n,
  municipio_mad: (c) => c.niveis.municipio.mad,
};

const COLUNAS_BIOMETRIA_UF = {
  sg_uf: (u) => u.sg_uf,
  qt_habilitados_por_biometria: (u) => u.qt_habilitados_por_biometria,
  percentual_habilitada: (u) => u.percentual_habilitada,
  qt_biometria_nao_habilitada: (u) => u.qt_biometria_nao_habilitada,
  percentual_nao_habilitada: (u) => u.percentual_nao_habilitada,
};

const COLUNAS_OUTLIERS = {
  sg_uf: (s) => s.sg_uf,
  nm_municipio: (s) => s.nm_municipio,
  nr_zona: (s) => s.nr_zona,
  nr_secao: (s) => s.nr_secao,
  score_if: (s) => s.score_if,
  score_lof: (s) => s.score_lof,
  candidato: (s) => s.vencedor?.nm_votavel,
};

const COLUNAS_ESTATISTICAS = {
  nm_votavel: (c) => c.nm_votavel,
  sg_partido: (c) => c.sg_partido,
  secoes: (c) => c.secoes,
  secoes_zero: null,
  media: (c) => c.media,
  mediana: (c) => c.mediana,
  desvio: (c) => c.desvio,
};

const COLUNAS_CONSISTENCIA = {
  sg_uf: (i) => i.secao.sg_uf,
  nm_municipio: (i) => i.secao.nm_municipio,
  nr_zona: (i) => i.secao.nr_zona,
  nr_secao: (i) => i.secao.nr_secao,
  regra: (i) => i.regra,
  diferenca: (i) => i.diferenca,
};

const COLUNAS_COMPARACAO_LOCAL = {
  sg_uf: (i) => i.secao.sg_uf,
  nm_municipio: (i) => i.secao.nm_municipio,
  nr_zona: (i) => i.secao.nr_zona,
  nr_secao: (i) => i.secao.nr_secao,
  participacao: (i) => i.metricas?.participacao,
  abstencao: (i) => i.metricas?.abstencao,
  participacao_pp: (i) => i.distancia_pp?.participacao_pp,
  abstencao_pp: (i) => i.distancia_pp?.abstencao_pp,
};

const diferencaPct = (valor, base) => (valor === null || valor === undefined || base === null || base === undefined ? null : valor - base);

const colunasRelatorio = (alvo) => ({
  referencia: (r) => r.ano_eleicao * 10 + r.nr_turno,
  bus: (r) => r.bus,
  participacao_pct: (r) => r.participacao_pct,
  diferenca_participacao: (r) => diferencaPct(r.participacao_pct, alvo?.participacao_pct),
  abstencao_pct: (r) => r.abstencao_pct,
  diferenca_abstencao: (r) => diferencaPct(r.abstencao_pct, alvo?.abstencao_pct),
  data_hora: (r) => r.recebimento.data_hora,
  somente_data: (r) => r.recebimento.somente_data,
  ausente: (r) => r.recebimento.ausente,
  outra_precisao: (r) => r.recebimento.outra_precisao,
  sem_encerramento: (r) => r.recebimento.sem_encerramento,
  antes_encerramento: (r) => r.recebimento.antes_encerramento,
  antes_emissao: (r) => r.recebimento.antes_emissao,
  mediana_atraso_min: (r) => r.recebimento.mediana_atraso_min,
  p90_atraso_min: (r) => r.recebimento.p90_atraso_min,
});

const COLUNAS_RESULTADOS = {
  cd_tipo_votavel: (r) => r.cd_tipo_votavel,
  nr_votavel: (r) => r.nr_votavel,
  nm_votavel: (r) => r.nm_votavel,
  sg_partido: (r) => r.sg_partido,
  categoria: (r) => r.categoria,
  qt_votos: (r) => (r.qt_votos === null || r.qt_votos === undefined ? null : Number(r.qt_votos)),
  percentual: (r) =>
    (r.categoria === 'nominal' || r.categoria === 'legenda') && r.qt_votos !== null && r.qt_votos !== undefined
      ? Number(r.qt_votos)
      : null,
};

const COLUNAS_CAMPOS_ALTERADOS = {
  campo: (c) => c.campo,
  anterior: (c) => c.anterior,
  atual: (c) => c.atual,
  diferenca: (c) => c.diferenca,
};

const COLUNAS_VOTAVEIS_ALTERADOS = {
  nr_votavel: (v) => v.nr_votavel,
  nm_votavel: (v) => v.nm_votavel,
  anterior: (v) => v.anterior,
  atual: (v) => v.atual,
  diferenca: (v) => v.diferenca,
};

const COLUNAS_ENCERRAMENTO_URNAS = {
  sg_uf: (u) => u.sg_uf,
  total: (u) => u.total,
  ate_1715: (u) => u.ate_1715,
  pct_1715: (u) => u.pct_1715,
  ate_1915: (u) => u.ate_1915,
  pct_1915: (u) => u.pct_1915,
  apos_1915: (u) => u.apos_1915,
  pct_apos_1915: (u) => u.pct_apos_1915,
};

const DERIVADAS_PARTIDO = {
  partido: (l) => l.partido,
  votos: (l) => l.votos,
  pct_votos: (l) => l.pct_votos,
};

const CHAVES_ENCERRAMENTO_MUNICIPIOS = ['nm_municipio', 'total', 'apos_1715', 'pct_apos_1715', ...Object.keys(DERIVADAS_PARTIDO)];
const CHAVES_ENCERRAMENTO_SECOES = ['nr_zona', 'nr_secao', 'dt_encerramento', ...Object.keys(DERIVADAS_PARTIDO)];
const CHAVES_BIOMETRIA_MUNICIPIOS = ['nm_municipio', 'qt_comparecimento', 'qt_nao_habilitada', 'percentual_nao_habilitada'];
const CHAVES_BIOMETRIA_SECOES = ['nr_zona', 'nr_secao', 'qt_comparecimento', 'qt_nao_habilitada', 'percentual_nao_habilitada'];

const COLUNAS_SECOES = {
  sg_uf: sql.ref('s.sg_uf'),
  nm_municipio: sql.ref('l.nm_municipio'),
  nr_zona: sql.ref('s.nr_zona'),
  nr_secao: sql.ref('s.nr_secao'),
  nr_local_votacao: sql.ref('s.nr_local_votacao'),
  status: null,
  bu_recebido: sql`coalesce(bv.dt_bu_recebido_ts, bv.dt_bu_recebido_data::timestamptz)`,
};

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

const TTL_CACHE_ESTATICO = 86400;

function escopoCache(query) {
  return {
    election_id: query.election_id,
    cargo: query.cargo,
    uf: query.uf,
    municipio: query.municipio,
    as_of: query.as_of,
    as_of_date: query.as_of_date,
  };
}

function cacheDeCorte(cache, recurso, query, calcular) {
  return cache.obter(recurso, escopoCache(query), TTL_CACHE_ESTATICO, calcular).then(({ valor }) => valor);
}

function escopoDe(query) {
  return { sgUf: query.uf, cdMunicipio: query.municipio };
}

const ENCERRAMENTO_BU = sql`coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts)`;

function escopoDaEleicao(query, eleicao, corte) {
  return { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };
}

function metadadosEAvisos(cache, db, query, escopo, corte) {
  return Promise.all([
    cacheDeCorte(cache, 'metadados', query, () => metadadosCorte(db, escopo, corte)),
    cacheDeCorte(cache, 'avisos', query, () => avisosCorte(db, escopo, corte)),
  ]);
}

function tamanhoPagina(app, query) {
  const padrao = app.config?.SECTIONS_PAGE_SIZE_DEFAULT ?? 50;
  const maximo = app.config?.SECTIONS_PAGE_SIZE_MAX ?? 200;
  return Math.min(query.page_size ?? padrao, maximo);
}

function resumoPartidoVencedor(linhasPartidos, chaveDe) {
  const acumulados = new Map();
  for (const linha of linhasPartidos) {
    const chave = chaveDe(linha);
    if (!acumulados.has(chave)) {
      acumulados.set(chave, { total: 0, partidos: new Map() });
    }
    const acumulado = acumulados.get(chave);
    const votos = Number(linha.votos);
    acumulado.total += votos;
    acumulado.partidos.set(linha.sg_partido, (acumulado.partidos.get(linha.sg_partido) ?? 0) + votos);
  }
  const resumos = new Map();
  for (const [chave, acumulado] of acumulados) {
    let partido = null;
    let votosPartido = 0;
    for (const [nome, votos] of acumulado.partidos) {
      if (votos > votosPartido) {
        votosPartido = votos;
        partido = nome;
      }
    }
    resumos.set(chave, { partido, votos: votosPartido, total: acumulado.total });
  }
  return resumos;
}

async function buscarEleicao(db, id) {
  const eleicao = await db
    .selectFrom('eleicao')
    .select([
      'id',
      'ano_eleicao',
      'cd_eleicao',
      'cd_pleito',
      'nr_turno',
      'dt_pleito',
      'dt_eleicao',
      'nm_tipo_eleicao',
      'ds_eleicao',
      'metadados_derivados',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
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

function itemSecao(linha) {
  return {
    id: linha.id,
    sg_uf: linha.sg_uf,
    cd_municipio_tse: linha.cd_municipio_tse,
    nm_municipio: linha.nm_municipio,
    nr_zona: linha.nr_zona,
    nr_secao: linha.nr_secao,
    nr_local_votacao: linha.nr_local_votacao,
    status: linha.status,
    motivo: linha.motivo,
    ...horariosDoBu(buDaSecao(linha)),
  };
}

function statusSql(corte) {
  let porCorte = sql`'bu_recebido'`;
  if (corte.tipo === 'recebimento_intradiario') {
    porCorte = sql`case
      when coalesce(bv.precisao_dt_bu_recebido, 'AUSENTE') = 'DATA_HORA' then
        case
          when bv.dt_bu_recebido_ts <= ${corte.instante} then 'bu_recebido'
          when bv.dt_encerramento <= ${corte.instante} or bv.dt_emissao_bu <= ${corte.instante} then 'encerrada_aguardando_bu'
          else 'sem_bu'
        end
      else 'desconhecido'
    end`;
  } else if (corte.tipo === 'recebimento_diario') {
    porCorte = sql`case
      when (bv.precisao_dt_bu_recebido = 'DATA_HORA' and (bv.dt_bu_recebido_ts at time zone 'America/Sao_Paulo')::date <= ${corte.data})
        or (bv.precisao_dt_bu_recebido = 'DATA' and bv.dt_bu_recebido_data <= ${corte.data}) then 'bu_recebido'
      when (bv.dt_encerramento at time zone 'America/Sao_Paulo')::date <= ${corte.data}
        or (bv.dt_emissao_bu at time zone 'America/Sao_Paulo')::date <= ${corte.data} then 'encerrada_aguardando_bu'
      when coalesce(bv.precisao_dt_bu_recebido, 'AUSENTE') = 'AUSENTE' then 'desconhecido'
      else 'sem_bu'
    end`;
  }

  return sql`case
    when bv.id is null then 'sem_bu'
    when bv.cd_tipo_urna = 2 then 'nao_apurada'
    when bv.cd_tipo_urna = 3 then 'anulada_apurada_separado'
    when bv.cd_tipo_urna = 4 then 'anulada'
    when bv.cd_tipo_urna = 5 then 'nao_instalada'
    when bv.cd_tipo_urna is null or bv.cd_tipo_urna not between 1 and 5 then 'desconhecido'
    else ${porCorte}
  end`;
}

function motivoSql(corte) {
  return sql`case
    when ${statusSql(corte)} = 'desconhecido' then
      case
        when bv.cd_tipo_urna is null or bv.cd_tipo_urna not between 1 and 5 then 'TIPO_URNA_AUSENTE'
        else 'PRECISAO_INSUFICIENTE'
      end
  end`;
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
      .where(sql`lower(ds_cargo_pergunta) in ('presidente', 'governador')`)
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

  app.get('/api/summary', cacheado('summary', 60, baseSchema.extend(ordenacaoSchema(Object.keys(COLUNAS_VOTOS))), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query), dataPleito: eleicao.dt_pleito };
    const semEscopo = !query.uf && !query.municipio;

    const [votos, metricas, secoes, [metadados, avisos]] = await Promise.all([
      somarVotos(db, escopo),
      corte.tipo === 'final' && semEscopo
        ? sql`select qt_aptos, qt_comparecimento, qt_abstencoes, bus_considerados from mv_metricas_final where eleicao_id = ${eleicao.id} and cargo = ${query.cargo}`
            .execute(db)
            .then((r) => {
              const linha = r.rows[0];
              if (!linha) {
                return somarMetricasSecao(db, escopo);
              }
              return {
                qt_aptos: Number(linha.qt_aptos ?? 0),
                qt_comparecimento: Number(linha.qt_comparecimento ?? 0),
                qt_abstencoes: Number(linha.qt_abstencoes ?? 0),
                bus_considerados: Number(linha.bus_considerados ?? 0),
                bus_sem_aptos: 0,
                bus_sem_comparecimento: 0,
                bus_sem_abstencoes: 0,
              };
            })
        : somarMetricasSecao(db, escopo),
      contarSecoesComBu(db, escopo),
      metadadosEAvisos(cache, db, query, escopo, corte),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      secoes_com_bu: secoes,
      votos: ordenarLista(votos, COLUNAS_VOTOS, lerOrdenacao(query)),
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
    const baseTimeline = () => {
      const qb = db
        .selectFrom('boletim_versao as bv')
        .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
        .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
        .where('bv.precisao_dt_bu_recebido', '=', 'DATA_HORA')
        .where('bv.eleicao_id', '=', eleicao.id)
        .where('bv.cd_cargo_pergunta', '=', query.cargo);
      return aplicarEscopo(aplicarFiltroCorte(qb, corte), escopoDe(query));
    };
    const instante = sql`date_bin(${intervalo}::interval, bv.dt_bu_recebido_ts, timestamptz '2000-01-01')`.as('t');

    const rows = await baseTimeline()
      .select([
        instante,
        sql`sum(rv.qt_votos)`.as('votos'),
        sql`count(distinct bv.secao_id)`.as('secoes'),
      ])
      .groupBy(sql`1`)
      .orderBy(sql`1`)
      .execute();

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
      const linhas = await baseTimeline()
        .select([
          instante,
          'rv.nr_votavel',
          sql`max(rv.nm_votavel)`.as('nm_votavel'),
          sql`sum(rv.qt_votos)`.as('votos'),
        ])
        .where('rv.categoria', '=', 'nominal')
        .where('rv.qt_votos', 'is not', null)
        .groupBy([sql`1`, sql`2`])
        .orderBy(sql`1`)
        .orderBy(sql`2`)
        .execute();

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

  app.get('/api/analysis', cacheado('analysis', 300, baseSchema.extend({
    ...ordenacaoSchema(Object.keys(COLUNAS_BENFORD)),
    ...ordenacaoSchema(Object.keys(COLUNAS_BIOMETRIA_UF), '_biometria_uf'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    };

    const [biometria, biometriaUf, benford, [metadados, avisos]] = await Promise.all([
      composicaoBiometria(db, escopo),
      biometriaPorUf(db, escopo),
      benfordPorCandidato(db, escopo),
      metadadosEAvisos(cache, db, query, escopo, corte),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      biometria,
      biometria_uf: ordenarLista(biometriaUf, COLUNAS_BIOMETRIA_UF, lerOrdenacao(query, '_biometria_uf')),
      benford: {
        minimo_votos: benford.minimo_votos,
        candidatos: ordenarLista(
          benford.candidatos.map(({ niveis, ...candidato }) => ({
            ...candidato,
            ...niveis.secao,
          })),
          COLUNAS_BENFORD,
          lerOrdenacao(query),
        ),
      },
      cobertura: {
        consideradas: biometria.secoes,
        bus_sem_aptos: biometria.bus_sem_aptos,
        bus_sem_comparecimento: biometria.bus_sem_comparecimento,
        bus_sem_abstencoes: biometria.bus_sem_abstencoes,
        bus_sem_biometria: biometria.bus_sem_biometria,
        secoes_abaixo_minimo_benford: benford.candidatos.reduce(
          (total, candidato) => total + (candidato.secoes_abaixo_minimo ?? 0),
          0,
        ),
      },
    };
  }));

  app.get('/api/anomalies', cacheado('anomalies', 600, baseSchema.extend({
    ...ordenacaoSchema(Object.keys(COLUNAS_OUTLIERS)),
    ...ordenacaoSchema(Object.keys(COLUNAS_DUPLICACAO), '_duplicacao'),
    ...ordenacaoSchema(Object.keys(COLUNAS_BENFORD_NIVEIS), '_benford'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    };

    const [linhas, duplicacao, [metadados, avisos]] = await Promise.all([
      baseSecaoCandidato(db, escopo),
      duplicacaoPorAssinatura(db, { ...escopo, ordenacao: lerOrdenacao(query, '_duplicacao') }),
      metadadosEAvisos(cache, db, query, escopo, corte),
    ]);

    const benfordBase = benfordDosNiveis(linhas);
    const benford = {
      ...benfordBase,
      candidatos: ordenarLista(benfordBase.candidatos, COLUNAS_BENFORD_NIVEIS, lerOrdenacao(query, '_benford')),
    };
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

    const vencedorPorMunicipio = new Map();
    for (const linha of linhas) {
      const chave = `${linha.sg_uf}|${linha.cd_municipio_tse}`;
      if (!vencedorPorMunicipio.has(chave)) {
        vencedorPorMunicipio.set(chave, new Map());
      }
      const candidatos = vencedorPorMunicipio.get(chave);
      const atual = candidatos.get(linha.nr_votavel) ?? {
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        votos: 0,
      };
      atual.votos += Number(linha.votos ?? 0);
      candidatos.set(linha.nr_votavel, atual);
    }
    const vencedorCidade = new Map();
    for (const [chave, candidatos] of vencedorPorMunicipio) {
      let vencedor = null;
      for (const candidato of candidatos.values()) {
        if (!vencedor || candidato.votos > vencedor.votos) {
          vencedor = candidato;
        }
      }
      if (vencedor) {
        vencedorCidade.set(chave, {
          nr_votavel: vencedor.nr_votavel,
          nm_votavel: vencedor.nm_votavel,
          sg_partido: vencedor.sg_partido,
        });
      }
    }
    const ranking = ordenarLista(
      secoes
        .map((secao, indice) => {
          const chave = `${secao.sg_uf}|${secao.cd_municipio_tse}`;
          const vencedor = vencedorCidade.get(chave) ?? null;
          return {
            ...secao,
            score_if: isolamento.scores[indice],
            score_lof: scoreLof.get(indice) ?? null,
            vencedor,
          };
        })
        .sort((a, b) => b.score_if - a.score_if),
      COLUNAS_OUTLIERS,
      lerOrdenacao(query),
    ).slice(0, 20);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      benford_niveis: benford,
      duplicacao,
      outliers: {
        features: FEATURES,
        parametros: {
          isolamento: {
            arvores: isolamento.arvores,
            amostra: isolamento.amostra,
          },
          lof: {
            k: lof.k,
            amostra: indices.length,
            limitado: secoes.length > indices.length,
          },
        },
        total_secoes: secoes.length,
        secoes: ranking,
      },
      cobertura: {
        consideradas: secoes.length,
        benford_abaixo_minimo: benford.candidatos.reduce(
          (total, candidato) => total + (candidato.niveis?.secao?.secoes_abaixo_minimo ?? 0),
          0,
        ),
        duplicacao_grupos: duplicacao.total_grupos ?? 0,
        duplicacao_secoes: duplicacao.total_secoes ?? 0,
        duplicacao_secoes_escopo: duplicacao.total_secoes_escopo ?? 0,
      },
    };
  }));

  app.get('/api/estatisticas', cacheado('estatisticas', 300, baseSchema.extend({
    escopo: z.enum(['turno', 'ano']).default('turno'),
    ...ordenacaoSchema(Object.keys(COLUNAS_ESTATISTICAS)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const irmaos = await eleicoesDoAno(db, { eleicao, cargo: query.cargo });
    const alvos = query.escopo === 'ano' && irmaos.length > 0 ? irmaos : [eleicao];
    const recorte = { cargo: query.cargo, corte, escopo: escopoDe(query) };

    const blocos = [];
    for (const alvo of alvos) {
      const bloco = await estatisticasDaEleicao(db, { eleicao: alvo, ...recorte });
      const colunas = {
        ...COLUNAS_ESTATISTICAS,
        secoes_zero: (c) => bloco.comparecimento.secoes - (c.secoes_com_voto ?? 0),
      };
      blocos.push({ ...bloco, candidatos: ordenarLista(bloco.candidatos, colunas, lerOrdenacao(query)) });
    }

    const secoesConsideradas = blocos.reduce(
      (total, bloco) => total + Number(bloco.comparecimento?.secoes ?? 0),
      0,
    );

    return {
      corte: corteResposta(corte),
      escopo: query.escopo,
      turnos_disponiveis: irmaos.map((irmao) => irmao.nr_turno),
      blocos,
      cobertura: {
        consideradas: secoesConsideradas,
        blocos: blocos.length,
      },
    };
  }));

  app.get('/api/map', cacheado('map', 300, baseSchema.extend({
    level: z.enum(['uf', 'municipio']).default('uf'),
    candidatos: z.string().optional(),
    as_of_anterior: z.string().optional(),
    ...ordenacaoSchema(Object.keys(COLUNAS_MAPA)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const corteAnterior = query.as_of_anterior ? resolverCorte({ as_of: query.as_of_anterior }) : null;
    const eleicao = await buscarEleicao(db, query.election_id);
    const candidatos = typeof query.candidatos === 'string' && query.candidatos.trim() !== ''
      ? query.candidatos
          .split(',')
          .map((valor) => Number(valor))
          .filter((valor) => Number.isInteger(valor) && valor !== 0)
      : [];
    const escopo = escopoDaEleicao(query, eleicao, corte);

    const [areas, areasAnteriores, [metadados, avisos], votosCandidatos] = await Promise.all([
      totaisPorArea(db, {
        eleicaoId: eleicao.id,
        cargo: query.cargo,
        corte,
        nivel: query.level,
        sgUf: query.uf,
        candidatos,
      }),
      corteAnterior
        ? totaisPorArea(db, {
            eleicaoId: eleicao.id,
            cargo: query.cargo,
            corte: corteAnterior,
            nivel: query.level,
            sgUf: query.uf,
            candidatos,
          })
        : Promise.resolve(null),
      metadadosEAvisos(cache, db, query, escopo, corte),
      somarVotos(db, { ...escopo, dataPleito: eleicao.dt_pleito }),
    ]);

    const nomePorNumero = new Map(votosCandidatos.map((v) => [Number(v.nr_votavel), v.nm_votavel]));
    const candidatoSelecionado = candidatos[0];

    const anterioresPorChave = new Map();
    if (areasAnteriores) {
      for (const a of areasAnteriores) {
        const chave = query.level === 'uf' ? a.sg_uf : a.cd_municipio_tse;
        anterioresPorChave.set(chave, a);
      }
    }

    const areasComDelta = areas.map((area) => {
      const chave = query.level === 'uf' ? area.sg_uf : area.cd_municipio_tse;
      const anterior = anterioresPorChave.get(chave);
      const anteriorPorCandidato = new Map((anterior?.candidatos ?? []).map((x) => [Number(x.nr_votavel), x]));
      const candidatosComDelta = (area.candidatos ?? []).map((c) => {
        const ant = anteriorPorCandidato.get(Number(c.nr_votavel));
        const delta = ant
          ? Math.max(0, Number(c.qt_votos ?? 0) - Number(ant.qt_votos ?? 0))
          : Number(c.qt_votos ?? 0);
        return { ...c, qt_votos_delta: delta };
      });
      const selecionado = candidatosComDelta.find((c) => Number(c.nr_votavel) === candidatoSelecionado);
      return {
        ...area,
        lider_nome: area.lider ? (nomePorNumero.get(Number(area.lider.nr_votavel)) ?? null) : null,
        candidato_votos: selecionado?.qt_votos ?? null,
        candidato_percentual: selecionado?.percentual ?? null,
        candidatos: candidatosComDelta,
      };
    });

    return {
      level: query.level,
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      areas: ordenarLista(areasComDelta, COLUNAS_MAPA, lerOrdenacao(query)),
    };
  }));

  app.get('/api/biometria/municipios', cacheado('biometria-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ...ordenacaoSchema(CHAVES_BIOMETRIA_MUNICIPIOS),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    let qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .leftJoin('localidade as l', (join) =>
        join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    qb = aplicarFiltroCorte(qb, corte);
    qb = qb.where('s.sg_uf', '=', query.uf);

    const colunas = {
      nm_municipio: sql`max(l.nm_municipio)`,
      qt_comparecimento: sql`coalesce(sum(bv.qt_comparecimento), 0)`,
      qt_nao_habilitada: sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao), 0)`,
      percentual_nao_habilitada: sql`(coalesce(sum(bv.qt_elei_biom_sem_habilitacao),0)::float / nullif(sum(bv.qt_comparecimento),0))`,
    };
    const linhas = await ordenarSql(
      qb
        .select([
          's.cd_municipio_tse',
          sql`max(l.nm_municipio)`.as('nm_municipio'),
          sql`coalesce(sum(bv.qt_comparecimento), 0)`.as('qt_comparecimento'),
          sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao), 0)`.as('qt_nao_habilitada'),
        ])
        .groupBy(['s.cd_municipio_tse', 's.sg_uf']),
      colunas,
      lerOrdenacao(query, '', { ordem: 'qt_nao_habilitada', direcao: 'desc' }),
      ['s.cd_municipio_tse'],
    )
      .limit(query.limit)
      .execute();

    return {
      corte: corteResposta(corte),
      municipios: linhas.map((linha) => {
        const comparecimento = Number(linha.qt_comparecimento);
        const naoHabilitada = Number(linha.qt_nao_habilitada);
        return {
          cd_municipio_tse: linha.cd_municipio_tse,
          nm_municipio: linha.nm_municipio,
          qt_comparecimento: comparecimento,
          qt_nao_habilitada: naoHabilitada,
          percentual_nao_habilitada:
            comparecimento > 0 ? (naoHabilitada / comparecimento) * 100 : null,
        };
      }),
    };
  }));

  app.get('/api/biometria/secoes', cacheado('biometria-secoes', 300, baseSchema.extend({
    uf: z.string().length(2),
    municipio: z.coerce.number().int(),
    ...ordenacaoSchema(CHAVES_BIOMETRIA_SECOES),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    let qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    qb = aplicarFiltroCorte(qb, corte);
    qb = qb.where('s.sg_uf', '=', query.uf).where('s.cd_municipio_tse', '=', query.municipio);

    const colunas = {
      nr_zona: sql.ref('s.nr_zona'),
      nr_secao: sql.ref('s.nr_secao'),
      qt_comparecimento: sql`coalesce(bv.qt_comparecimento, 0)`,
      qt_nao_habilitada: sql`coalesce(bv.qt_elei_biom_sem_habilitacao, 0)`,
      percentual_nao_habilitada: sql`(coalesce(bv.qt_elei_biom_sem_habilitacao,0)::float / nullif(bv.qt_comparecimento,0))`,
    };
    const linhas = await ordenarSql(
      qb.select([
        's.id',
        's.nr_zona',
        's.nr_secao',
        sql`bv.qt_comparecimento`.as('qt_comparecimento'),
        sql`bv.qt_elei_biom_sem_habilitacao`.as('qt_nao_habilitada'),
      ]),
      colunas,
      lerOrdenacao(query, '', { ordem: 'percentual_nao_habilitada', direcao: 'desc' }),
      ['s.id'],
    )
      .limit(query.limit)
      .execute();

    return {
      corte: corteResposta(corte),
      secoes: linhas.map((linha) => {
        const comparecimento = Number(linha.qt_comparecimento ?? 0);
        const naoHabilitada = Number(linha.qt_nao_habilitada ?? 0);
        return {
          id: linha.id,
          nr_zona: linha.nr_zona,
          nr_secao: linha.nr_secao,
          qt_comparecimento: comparecimento,
          qt_nao_habilitada: naoHabilitada,
          percentual_nao_habilitada:
            comparecimento > 0 ? (naoHabilitada / comparecimento) * 100 : null,
        };
      }),
    };
  }));

  app.get('/api/encerramento/urnas', cacheado('encerramento-urnas', 300, baseSchema.extend(ordenacaoSchema(Object.keys(COLUNAS_ENCERRAMENTO_URNAS))), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;
    const corte1915 = `${eleicao.dt_pleito} 19:15:00-03`;

    let qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    qb = aplicarFiltroCorte(qb, corte);

    const linhas = await qb
      .select([
        's.sg_uf',
        sql`count(*)::int`.as('total'),
        sql`count(*) filter (where ${ENCERRAMENTO_BU} <= ${corte1715}::timestamptz)::int`.as('ate_1715'),
        sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz and ${ENCERRAMENTO_BU} <= ${corte1915}::timestamptz)::int`.as('ate_1915'),
        sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1915}::timestamptz)::int`.as('apos_1915'),
      ])
      .groupBy('s.sg_uf')
      .orderBy('s.sg_uf')
      .execute();

    return {
      corte: corteResposta(corte),
      ufs: ordenarLista(
        linhas.map((l) => {
          const total = Number(l.total);
          const a1715 = Number(l.ate_1715);
          const a1915 = Number(l.ate_1915);
          const apos = Number(l.apos_1915);
          return {
            sg_uf: l.sg_uf,
            total,
            ate_1715: a1715,
            pct_1715: total > 0 ? (a1715 / total) * 100 : null,
            ate_1915: a1915,
            pct_1915: total > 0 ? (a1915 / total) * 100 : null,
            apos_1915: apos,
            pct_apos_1915: total > 0 ? (apos / total) * 100 : null,
          };
        }),
        COLUNAS_ENCERRAMENTO_URNAS,
        lerOrdenacao(query),
      ),
    };
  }));

  app.get('/api/encerramento/municipios', cacheado('encerramento-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ...ordenacaoSchema(CHAVES_ENCERRAMENTO_MUNICIPIOS),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;

    let qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .leftJoin('localidade as l', (join) =>
        join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    qb = aplicarFiltroCorte(qb, corte);
    qb = qb.where('s.sg_uf', '=', query.uf);

    const aposExpr = sql`count(*) filter (where ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz)`;
    const colunasSql = {
      nm_municipio: sql`max(l.nm_municipio)`,
      total: sql`count(*)`,
      apos_1715: aposExpr,
      pct_apos_1715: sql`(${aposExpr})::float / nullif(count(*),0)`,
    };
    const ordenacao = lerOrdenacao(query, '', { ordem: 'pct_apos_1715', direcao: 'desc' });
    const derivada = ordenacao.ordem in DERIVADAS_PARTIDO;
    const consultaMunicipios = ordenarSql(
      qb
        .select([
          's.cd_municipio_tse',
          sql`max(l.nm_municipio)`.as('nm_municipio'),
          sql`count(*)::int`.as('total'),
          sql`${aposExpr}::int`.as('apos_1715'),
        ])
        .groupBy(['s.cd_municipio_tse', 's.sg_uf']),
      colunasSql,
      derivada ? { ordem: 'pct_apos_1715', direcao: 'desc' } : ordenacao,
      ['s.cd_municipio_tse'],
    );
    const linhas = await (derivada ? consultaMunicipios : consultaMunicipios.limit(query.limit)).execute();

    let qbPartidos = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo)
      .where('s.sg_uf', '=', query.uf)
      .where('rv.categoria', 'in', ['nominal', 'legenda'])
      .where('rv.qt_votos', 'is not', null);
    qbPartidos = aplicarFiltroCorte(qbPartidos, corte);

    const linhasPartidos = await qbPartidos
      .select([
        's.cd_municipio_tse',
        'rv.sg_partido',
        sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('votos'),
      ])
      .groupBy(['s.cd_municipio_tse', 'rv.sg_partido'])
      .execute();

    const resumoPorMunicipio = resumoPartidoVencedor(linhasPartidos, (linha) => linha.cd_municipio_tse);

    return {
      corte: corteResposta(corte),
      municipios: (() => {
        const itens = linhas.map((l) => {
          const total = Number(l.total);
          const apos = Number(l.apos_1715);
          const resumo = resumoPorMunicipio.get(l.cd_municipio_tse) ?? {
            partido: null,
            votos: 0,
            total: 0,
          };
          return {
            cd_municipio_tse: l.cd_municipio_tse,
            nm_municipio: l.nm_municipio,
            total,
            apos_1715: apos,
            pct_apos_1715: total > 0 ? (apos / total) * 100 : null,
            partido: resumo.partido,
            votos: resumo.votos,
            pct_votos: resumo.total > 0 ? (resumo.votos / resumo.total) * 100 : null,
          };
        });
        return derivada ? ordenarLista(itens, DERIVADAS_PARTIDO, ordenacao).slice(0, query.limit) : itens;
      })(),
    };
  }));

  app.get('/api/encerramento/secoes', cacheado('encerramento-secoes', 300, baseSchema.extend({
    uf: z.string().length(2),
    municipio: z.coerce.number().int(),
    ...ordenacaoSchema(CHAVES_ENCERRAMENTO_SECOES),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const corte1715 = `${eleicao.dt_pleito} 17:15:00-03`;

    let qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    qb = aplicarFiltroCorte(qb, corte);
    qb = qb.where('s.sg_uf', '=', query.uf).where('s.cd_municipio_tse', '=', query.municipio);

    const ordenacao = lerOrdenacao(query);
    const derivada = ordenacao !== null && ordenacao.ordem in DERIVADAS_PARTIDO;
    const consultaSecoes = qb.select([
      's.id',
      sql`bv.id`.as('bu_id'),
      's.nr_zona',
      's.nr_secao',
      ENCERRAMENTO_BU.as('dt_encerramento'),
      sql`case when ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz then true else false end`.as('apos_1715'),
    ]);
    const ordenada =
      ordenacao && !derivada
        ? ordenarSql(
            consultaSecoes,
            {
              nr_zona: sql.ref('s.nr_zona'),
              nr_secao: sql.ref('s.nr_secao'),
              dt_encerramento: ENCERRAMENTO_BU,
            },
            ordenacao,
            ['s.id'],
          )
        : consultaSecoes.orderBy(sql`(case when ${ENCERRAMENTO_BU} > ${corte1715}::timestamptz then 1 else 0 end) desc, ${ENCERRAMENTO_BU} desc nulls last`);
    const linhas = await (derivada ? ordenada : ordenada.limit(query.limit)).execute();

    const ids = linhas.map((linha) => linha.bu_id).filter(Boolean);
    let resumoPorBu = new Map();
    if (ids.length > 0) {
      const linhasPartidos = await db
        .selectFrom('resultado_votavel as rv')
        .select([
          'rv.boletim_versao_id',
          'rv.sg_partido',
          sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('votos'),
        ])
        .where('rv.boletim_versao_id', 'in', ids)
        .where('rv.categoria', 'in', ['nominal', 'legenda'])
        .where('rv.qt_votos', 'is not', null)
        .groupBy(['rv.boletim_versao_id', 'rv.sg_partido'])
        .execute();

      resumoPorBu = resumoPartidoVencedor(linhasPartidos, (linha) => linha.boletim_versao_id);
    }

    return {
      corte: corteResposta(corte),
      secoes: (() => {
        const itens = linhas.map((l) => {
          const resumo = resumoPorBu.get(l.bu_id) ?? { partido: null, votos: 0, total: 0 };
          return {
            id: l.id,
            nr_zona: l.nr_zona,
            nr_secao: l.nr_secao,
            dt_encerramento: l.dt_encerramento,
            apos_1715: Boolean(l.apos_1715),
            partido: resumo.partido,
            votos: resumo.votos,
            pct_votos: resumo.total > 0 ? (resumo.votos / resumo.total) * 100 : null,
          };
        });
        return derivada ? ordenarLista(itens, DERIVADAS_PARTIDO, ordenacao).slice(0, query.limit) : itens;
      })(),
    };
  }));

  app.get('/api/consistencia', cacheado('consistencia', 300, baseSchema.extend({
    regra: z.enum([
      'comparecimento_vs_votos',
      'aptos_vs_comparecimento_abstencao',
      'comparecimento_vs_aptos',
      'biometria_vs_comparecimento',
    ]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).optional(),
    ...ordenacaoSchema(Object.keys(COLUNAS_CONSISTENCIA)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const pageSize = tamanhoPagina(app, query);

    const resultado = await consistenciaPorSecao(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    });

    const divergenciasBase = [];
    for (const item of resultado.secoes) {
      for (const regra of item.regras) {
        if (regra.status !== 'divergente') continue;
        if (query.regra && regra.regra !== query.regra) continue;
        divergenciasBase.push({
          secao: item.secao,
          regra: regra.regra,
          diferenca: regra.diferenca,
          campos: regra.campos,
          valores: regra.valores,
          bu: item.bu,
        });
      }
    }
    const divergencias = ordenarLista(divergenciasBase, COLUNAS_CONSISTENCIA, lerOrdenacao(query));

    const [metadados, avisos] = await metadadosEAvisos(cache, db, query, escopoDaEleicao(query, eleicao, corte), corte);

    const inicio = (query.page - 1) * pageSize;
    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      cobertura: resultado.cobertura,
      page: query.page,
      page_size: pageSize,
      total: divergencias.length,
      itens: divergencias.slice(inicio, inicio + pageSize),
    };
  }));

  app.get('/api/relatorio', cacheado('relatorio', 300, baseSchema.extend(ordenacaoSchema(Object.keys(colunasRelatorio()))), async (query) => {
    const eleicao = await buscarEleicao(db, query.election_id);
    const corte = resolverCorte(query);
    const agregadosRelatorio = () => [
      sql`count(*)::int`.as('bus'),
      sql`count(*) filter (where bv.qt_aptos is null)::int`.as('sem_aptos'),
      sql`count(*) filter (where bv.qt_comparecimento is null)::int`.as('sem_comparecimento'),
      sql`count(*) filter (where bv.qt_abstencoes is null)::int`.as('sem_abstencoes'),
      sql`sum(bv.qt_aptos)::bigint`.as('aptos'),
      sql`sum(bv.qt_comparecimento)::bigint`.as('comparecimento'),
      sql`sum(bv.qt_abstencoes)::bigint`.as('abstencoes'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA')::int`.as('recebimento_hora'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA')::int`.as('recebimento_data'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'AUSENTE')::int`.as('recebimento_ausente'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido is null or bv.precisao_dt_bu_recebido not in ('DATA_HORA', 'DATA', 'AUSENTE'))::int`.as('recebimento_outra'),
      sql`count(*) filter (where bv.dt_encerramento is null)::int`.as('sem_encerramento'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null and bv.dt_bu_recebido_ts < bv.dt_encerramento)::int`.as('recebido_antes_encerramento'),
      sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_emissao_bu is not null and bv.dt_bu_recebido_ts < bv.dt_emissao_bu)::int`.as('recebido_antes_emissao'),
      sql`percentile_cont(0.5) within group (order by extract(epoch from (bv.dt_bu_recebido_ts - bv.dt_encerramento)) / 60) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null)`.as('mediana_atraso_min'),
      sql`percentile_cont(0.9) within group (order by extract(epoch from (bv.dt_bu_recebido_ts - bv.dt_encerramento)) / 60) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null)`.as('p90_atraso_min'),
    ];
    let atualQuery = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.eleicao_id', '=', eleicao.id)
      .where('bv.cd_cargo_pergunta', '=', query.cargo);
    atualQuery = aplicarFiltroCorte(aplicarEscopo(atualQuery, escopoDe(query)), corte);

    const resumoAtual = await atualQuery
      .select(agregadosRelatorio())
      .executeTakeFirstOrThrow();

    let referencias = [];
    if (corte.tipo === 'final') {
      let referenciasQuery = db
        .selectFrom('boletim_versao as bv')
        .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
        .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
        .where('bv.ativo', '=', true)
        .where('bv.cd_tipo_urna', '=', 1)
        .where(CARGO_EM_ESCOPO)
        .where('bv.cd_cargo_pergunta', '=', query.cargo)
        .where('e.id', '!=', eleicao.id);
      referenciasQuery = eleicao.nm_tipo_eleicao
        ? referenciasQuery.where('e.nm_tipo_eleicao', '=', eleicao.nm_tipo_eleicao)
        : referenciasQuery.where('e.nm_tipo_eleicao', 'is', null);
      referenciasQuery = aplicarEscopo(referenciasQuery, escopoDe(query));
      referencias = await referenciasQuery
        .select([
          'e.id as election_id',
          'e.ano_eleicao',
          'e.nr_turno',
          'e.cd_eleicao',
          'e.cd_pleito',
          'e.ds_eleicao',
          ...agregadosRelatorio(),
        ])
        .groupBy(['e.id', 'e.ano_eleicao', 'e.nr_turno', 'e.cd_eleicao', 'e.cd_pleito', 'e.ds_eleicao'])
        .orderBy('e.ano_eleicao', 'desc')
        .orderBy('e.nr_turno', 'desc')
        .execute();
    }

    const metricas = (dados) => {
      const bus = Number(dados.bus);
      const aptos = Number(dados.sem_aptos) === 0 && dados.aptos !== null ? Number(dados.aptos) : null;
      const comparecimento =
        Number(dados.sem_comparecimento) === 0 && dados.comparecimento !== null
          ? Number(dados.comparecimento)
          : null;
      const abstencoes =
        Number(dados.sem_abstencoes) === 0 && dados.abstencoes !== null
          ? Number(dados.abstencoes)
          : null;
      const numeroOpcional = (valor) => (valor === null || valor === undefined ? null : Number(valor));
      return {
        bus,
        aptos,
        comparecimento,
        abstencoes,
        participacao_pct: aptos > 0 && comparecimento !== null ? (comparecimento / aptos) * 100 : null,
        abstencao_pct: aptos > 0 && abstencoes !== null ? (abstencoes / aptos) * 100 : null,
        cobertura: {
          sem_aptos: Number(dados.sem_aptos),
          sem_comparecimento: Number(dados.sem_comparecimento),
          sem_abstencoes: Number(dados.sem_abstencoes),
        },
        recebimento: {
          data_hora: Number(dados.recebimento_hora),
          somente_data: Number(dados.recebimento_data),
          ausente: Number(dados.recebimento_ausente),
          outra_precisao: Number(dados.recebimento_outra),
          sem_encerramento: Number(dados.sem_encerramento),
          antes_encerramento: Number(dados.recebido_antes_encerramento),
          antes_emissao: Number(dados.recebido_antes_emissao),
          mediana_atraso_min: numeroOpcional(dados.mediana_atraso_min),
          p90_atraso_min: numeroOpcional(dados.p90_atraso_min),
        },
      };
    };

    const alvo = {
      election_id: eleicao.id,
      ano_eleicao: eleicao.ano_eleicao,
      nr_turno: eleicao.nr_turno,
      cd_eleicao: eleicao.cd_eleicao,
      cd_pleito: eleicao.cd_pleito,
      ds_eleicao: eleicao.ds_eleicao,
      ...metricas(resumoAtual),
    };

    return {
      alvo,
      comparacao_final_disponivel: corte.tipo === 'final',
      referencias: ordenarLista(
        referencias.map((referencia) => ({
          election_id: referencia.election_id,
          ano_eleicao: referencia.ano_eleicao,
          nr_turno: referencia.nr_turno,
          cd_eleicao: referencia.cd_eleicao,
          cd_pleito: referencia.cd_pleito,
          ds_eleicao: referencia.ds_eleicao,
          ...metricas(referencia),
        })),
        colunasRelatorio(alvo),
        lerOrdenacao(query),
      ),
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
    ...ordenacaoSchema(Object.keys(COLUNAS_SECOES)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const pageSize = tamanhoPagina(app, query);

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
        statusSql(corte).as('status'),
        motivoSql(corte).as('motivo'),
        sql`count(*) over()`.as('total_count'),
      ])
      .where('s.ano_eleicao', '=', eleicao.ano_eleicao)
      .where('s.cd_pleito', '=', eleicao.cd_pleito)
      .where('s.nr_turno', '=', eleicao.nr_turno);

    const ordenacao = lerOrdenacao(query);
    consulta = ordenacao
      ? ordenarSql(consulta, { ...COLUNAS_SECOES, status: statusSql(corte) }, ordenacao, ['s.sg_uf', 's.cd_municipio_tse', 's.nr_zona', 's.nr_secao', 's.id'])
      : consulta.orderBy('s.sg_uf').orderBy('s.cd_municipio_tse').orderBy('s.nr_zona').orderBy('s.nr_secao');

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

    if (query.status) consulta = consulta.where(sql`${statusSql(corte)} = ${query.status}`);
    const consultaTotal = consulta.clearSelect().clearOrderBy().select(sql`count(*)::bigint`.as('total_count'));
    consulta = consulta.limit(pageSize).offset((query.page - 1) * pageSize);

    const linhas = await consulta.execute();
    const total = Number(
      linhas[0]?.total_count ?? (await consultaTotal.executeTakeFirstOrThrow()).total_count,
    );
    const itens = linhas.map(itemSecao);

    const [metadados, avisos] = await metadadosEAvisos(cache, db, query, escopoDaEleicao(query, eleicao, corte), corte);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      page: query.page,
      page_size: pageSize,
      total,
      items: itens,
    };
  }));

  app.get('/api/sections/:id', cacheado('section', 300, z.object({
    id: z.string().uuid(),
    election_id: z.string().uuid(),
    cargo: z.coerce.number().int(),
    ...corteSchema,
    ...ordenacaoSchema(Object.keys(COLUNAS_RESULTADOS)),
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

    const statusBu = boletim
      ? await db
          .selectFrom('boletim_versao as bv')
          .select([statusSql(corte).as('status'), motivoSql(corte).as('motivo')])
          .where('bv.id', '=', boletim.id)
          .executeTakeFirstOrThrow()
      : { status: 'sem_bu', motivo: null };

    const [resultados, lote, anteriores] = boletim
      ? await Promise.all([
          db
            .selectFrom('resultado_votavel')
            .selectAll()
            .where('boletim_versao_id', '=', boletim.id)
            .orderBy('qt_votos', 'desc')
            .execute(),
          db
            .selectFrom('lote_importacao')
            .select(['id', 'nome_arquivo', 'sha256'])
            .where('id', '=', boletim.lote_id)
            .executeTakeFirst(),
          db
            .selectFrom('boletim_versao')
            .select(({ fn }) => fn.countAll().as('total'))
            .where('secao_id', '=', query.id)
            .where('eleicao_id', '=', eleicao.id)
            .where('cd_cargo_pergunta', '=', query.cargo)
            .where('versao', '<', boletim.versao)
            .executeTakeFirstOrThrow(),
        ])
      : [[], null, { total: 0 }];

    const consistencia = boletim
      ? validarConsistenciaBu(
          {
            qt_aptos: boletim.qt_aptos,
            qt_comparecimento: boletim.qt_comparecimento,
            qt_abstencoes: boletim.qt_abstencoes,
            qt_elei_biom_sem_habilitacao: boletim.qt_elei_biom_sem_habilitacao,
          },
          resultados,
        )
      : [];

    return {
      secao,
      status: { ...statusBu, horarios: horariosDoBu(boletim ?? null) },
      boletim,
      resultados: ordenarLista(resultados, COLUNAS_RESULTADOS, lerOrdenacao(query)),
      lote,
      versoes_anteriores: Number(anteriores.total),
      consistencia,
    };
  }));

  app.get('/api/sections/:id/versions', cacheado('section-versions', 300, z.object({
    id: z.string().uuid(),
    election_id: z.string().uuid(),
    cargo: z.coerce.number().int(),
    comparar_com: z.coerce.number().int().optional(),
    ...corteSchema,
    ...ordenacaoSchema(Object.keys(COLUNAS_CAMPOS_ALTERADOS), '_campos'),
    ...ordenacaoSchema(Object.keys(COLUNAS_VOTAVEIS_ALTERADOS), '_votaveis'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secao = await db
      .selectFrom('secao_eleitoral as s')
      .innerJoin('localidade as l', (join) =>
        join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .select(['s.id','s.sg_uf','s.cd_municipio_tse','s.nr_zona','s.nr_secao','s.nr_local_votacao','l.nm_municipio'])
      .where('s.id', '=', query.id)
      .executeTakeFirst();
    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const versoesRows = await db
      .selectFrom('boletim_versao')
      .selectAll()
      .where('secao_id', '=', query.id)
      .where('eleicao_id', '=', eleicao.id)
      .where('cd_cargo_pergunta', '=', query.cargo)
      .orderBy('versao', 'asc')
      .execute();

    const ids = versoesRows.map((v) => v.id);
    const resultados = ids.length
      ? await db.selectFrom('resultado_votavel').selectAll().where('boletim_versao_id', 'in', ids).execute()
      : [];
    const porBu = new Map();
    for (const r of resultados) {
      if (!porBu.has(r.boletim_versao_id)) porBu.set(r.boletim_versao_id, []);
      porBu.get(r.boletim_versao_id).push(r);
    }
    const loteIds = [...new Set(versoesRows.map((v) => v.lote_id))];
    const lotes = loteIds.length
      ? await db.selectFrom('lote_importacao').select(['id','nome_arquivo','sha256']).where('id', 'in', loteIds).execute()
      : [];
    const loteMap = new Map(lotes.map((l) => [l.id, l]));

    const versoes =versoesRows.map((bv) => ({
      id: bv.id,
      versao: bv.versao,
      ativo: bv.ativo,
      substitui_versao_id: bv.substitui_versao_id,
      dt_geracao: bv.dt_geracao,
      dt_abertura: bv.dt_abertura,
      dt_encerramento: bv.dt_encerramento,
      dt_emissao_bu: bv.dt_emissao_bu,
      dt_bu_recebido_ts: bv.dt_bu_recebido_ts,
      dt_bu_recebido_data: bv.dt_bu_recebido_data,
      precisao_dt_bu_recebido: bv.precisao_dt_bu_recebido,
      qt_aptos: bv.qt_aptos,
      qt_comparecimento: bv.qt_comparecimento,
      qt_abstencoes: bv.qt_abstencoes,
      qt_elei_biom_sem_habilitacao: bv.qt_elei_biom_sem_habilitacao,
      cd_tipo_urna: bv.cd_tipo_urna,
      ds_tipo_urna: bv.ds_tipo_urna,
      lote: loteMap.get(bv.lote_id) ?? null,
      conteudo_sha256: bv.conteudo_sha256,
      imported_at: bv.imported_at,
      resultados: (porBu.get(bv.id) ?? []).sort((x, y) => Number(y.qt_votos ?? 0) - Number(x.qt_votos ?? 0)),
    }));

    const atual = versoes.find((v) => v.ativo) ?? versoes[versoes.length - 1] ?? null;
    let anterior = null;
    if (atual) {
      if (query.comparar_com !== undefined) {
        anterior = versoes.find((v) => v.versao === query.comparar_com) ?? null;
      } else {
        const candidatos = versoes.filter((v) => v.versao < atual.versao);
        anterior = candidatos.sort((x, y) => y.versao - x.versao)[0] ?? null;
      }
    }
    const diferencas = anterior && atual ? compararVersoes(anterior, atual) : null;
    const comparacao = diferencas
      ? {
          anterior: anterior.versao,
          atual: atual.versao,
          ...diferencas,
          campos_alterados: ordenarLista(diferencas.campos_alterados, COLUNAS_CAMPOS_ALTERADOS, lerOrdenacao(query, '_campos')),
          votaveis_alterados: ordenarLista(diferencas.votaveis_alterados, COLUNAS_VOTAVEIS_ALTERADOS, lerOrdenacao(query, '_votaveis')),
        }
      : null;

    return {
      corte: corteResposta(corte),
      secao,
      versoes,
      comparacao,
    };
  }));

  app.get('/api/comparacao-local', cacheado('comparacao-local', 300, baseSchema.extend({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).optional(),
    ...ordenacaoSchema(Object.keys(COLUNAS_COMPARACAO_LOCAL)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const pageSize = tamanhoPagina(app, query);

    const resultado = await comparacaoLocal(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    });

    const [metadados, avisos] = await metadadosEAvisos(cache, db, query, escopoDaEleicao(query, eleicao, corte), corte);

    const grupos = resultado.grupos ?? [];
    const inicio = (query.page - 1) * pageSize;
    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      cobertura: resultado.cobertura,
      page: query.page,
      page_size: pageSize,
      total: grupos.length,
      grupos: grupos.slice(inicio, inicio + pageSize).map(({ secoes, ...grupo }) => grupo),
    };
  }));

  app.get('/api/comparacao-local/secoes', cacheado('comparacao-local-secoes', 300, baseSchema.extend({
    chave: z.string().regex(/^(local|zona|municipio):[A-Z]{2}\|\d+(\|\d+)?$/),
    ...ordenacaoSchema(Object.keys(COLUNAS_COMPARACAO_LOCAL)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const [, uf, municipio] = /^\w+:([A-Z]{2})\|(\d+)/.exec(query.chave);

    const resultado = await comparacaoLocal(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: { sgUf: uf, cdMunicipio: Number(municipio) },
    });

    const grupo = (resultado.grupos ?? []).find((item) => item.chave === query.chave);
    if (!grupo) throw new AppError('NOT_FOUND', 404, 'Grupo não encontrado');

    return {
      corte: corteResposta(corte),
      chave: grupo.chave,
      secoes: ordenarLista(grupo.secoes, COLUNAS_COMPARACAO_LOCAL, lerOrdenacao(query)),
    };
  }));

  app.get('/api/concentracao', cacheado('concentracao', 300, baseSchema.extend({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).optional(),
    ...ordenacaoSchema(Object.keys(COLUNAS_CONCENTRACAO), '_share'),
    ...ordenacaoSchema(Object.keys(COLUNAS_CONCENTRACAO), '_margem'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const pageSize = tamanhoPagina(app, query);

    const resultado = await concentracao(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
      limite: query.limit,
      ordenacaoShare: lerOrdenacao(query, '_share'),
      ordenacaoMargem: lerOrdenacao(query, '_margem'),
    });

    const [metadados, avisos] = await metadadosEAvisos(cache, db, query, escopoDaEleicao(query, eleicao, corte), corte);

    const inicio = (query.page - 1) * pageSize;

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      cobertura: resultado.cobertura,
      page: query.page,
      page_size: pageSize,
      total: resultado.top_share.length,
      top_share: resultado.top_share.slice(inicio, inicio + pageSize),
      top_margem: resultado.top_margem.slice(inicio, inicio + pageSize),
    };
  }));
}
