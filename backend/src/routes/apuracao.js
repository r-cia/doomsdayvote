import { sql } from 'kysely';
import { z } from 'zod';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { contarSecoesComBu } from '../modules/apuracao/progresso.js';
import { linhaDoTempo } from '../modules/apuracao/timeline.js';
import { areasComDeltaEntreCortes, somarMetricasSecao, somarVotos, totaisPorArea } from '../modules/apuracao/totais.js';
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

    const { pontos, series } = await linhaDoTempo(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
      granularidade: query.granularity,
      porCandidato: query.por_candidato === 'true',
    });

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

    const areasComDelta = areasComDeltaEntreCortes({
      areas,
      areasAnteriores,
      nivel: query.level,
      candidatoSelecionado: candidatos[0],
      votosCandidatos,
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
