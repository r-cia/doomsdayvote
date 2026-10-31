import { sql } from 'kysely';
import { z } from 'zod';
import { aplicarEscopo, aplicarFiltroCorte, corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { contarSecoesComBu } from '../modules/apuracao/progresso.js';
import { somarMetricasSecao, somarVotos, totaisPorArea } from '../modules/apuracao/totais.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao, escopoDaEleicao, escopoDe, metadadosEAvisos } from './comum.js';

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

export function registrarApuracao({ app, db, cache, cacheado }) {
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
}
