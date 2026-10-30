import { sql } from 'kysely';
import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { validar } from '../lib/validar.js';
import { aplicarFiltroCorte, avisosCorte, corteResposta, metadadosCorte, resolverCorte } from '../modules/apuracao/corte.js';
import { contarSecoesComBu } from '../modules/apuracao/progresso.js';
import { classificarStatusSecao } from '../modules/apuracao/status-secao.js';
import { somarMetricasSecao, somarVotos, totaisPorArea } from '../modules/apuracao/totais.js';
import { baseSecaoCandidato, benfordDosNiveis, benfordPorCandidato, biometriaPorUf, composicaoBiometria, featuresDasSecoes } from '../modules/analise/estatisticas.js';
import { eleicoesDoAno, estatisticasDaEleicao } from '../modules/analise/descritivas.js';
import { duplicacaoPorAssinatura } from '../modules/analise/duplicacao.js';
import { consistenciaPorSecao, validarConsistenciaBu } from '../modules/analise/consistencia.js';
import { compararVersoes } from '../modules/analise/versoes-bu.js';
import { comparacaoLocal } from '../modules/analise/comparacao-local.js';
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
  const eleicao = await db
    .selectFrom('eleicao')
    .select(['id', 'ano_eleicao', 'cd_pleito', 'nr_turno', 'dt_pleito', 'dt_eleicao', 'metadados_derivados'])
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
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query), dataPleito: eleicao.dt_pleito };
    const semEscopo = !query.uf && !query.municipio;

    const [votos, metricas, secoes, metadados, avisos] = await Promise.all([
      somarVotos(db, escopo),
      corte.tipo === 'final' && semEscopo
        ? sql`select qt_aptos, qt_comparecimento, qt_abstencoes, bus_considerados from mv_metricas_final where eleicao_id = ${eleicao.id} and cargo = ${query.cargo}`
            .execute(db)
            .then((r) => {
              const linha = r.rows[0] ?? {};
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
      cache.obter('metadados', query, 300, () => metadadosCorte(db, escopo, corte)).then((r) => r.valor),
      cache.obter('avisos', query, 300, () => avisosCorte(db, escopo, corte)).then((r) => r.valor),
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

    const [biometria, biometriaUf, benford, metadados, avisos] = await Promise.all([
      composicaoBiometria(db, escopo),
      biometriaPorUf(db, escopo),
      benfordPorCandidato(db, escopo),
      cache.obter('metadados', query, 300, () => metadadosCorte(db, escopo, corte)).then((r) => r.valor),
      cache.obter('avisos', query, 300, () => avisosCorte(db, escopo, corte)).then((r) => r.valor),
    ]);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      biometria,
      biometria_uf: biometriaUf,
      benford: {
        minimo_votos: benford.minimo_votos,
        candidatos: benford.candidatos.map(({ niveis, ...candidato }) => ({
          ...candidato,
          ...niveis.secao,
        })),
      },
    };
  }));

  app.get('/api/anomalies', cacheado('anomalies', 600, baseSchema.extend({
    ordenar_por: z.enum(['if', 'lof']).default('if'),
  }), async (query) => {
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
      cache.obter('metadados', query, 300, () => metadadosCorte(db, escopo, corte)).then((r) => r.valor),
      cache.obter('avisos', query, 300, () => avisosCorte(db, escopo, corte)).then((r) => r.valor),
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

    const vencedorPorMunicipio = new Map()
    for (const linha of linhas) {
      const chave = `${linha.sg_uf}|${linha.cd_municipio_tse}`
      if (!vencedorPorMunicipio.has(chave)) {
        vencedorPorMunicipio.set(chave, new Map())
      }
      const candidatos = vencedorPorMunicipio.get(chave)
      const atual = candidatos.get(linha.nr_votavel) ?? {
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        votos: 0,
      }
      atual.votos += Number(linha.votos ?? 0)
      candidatos.set(linha.nr_votavel, atual)
    }
    const vencedorCidade = new Map()
    for (const [chave, candidatos] of vencedorPorMunicipio) {
      let vencedor = null
      for (const candidato of candidatos.values()) {
        if (!vencedor || candidato.votos > vencedor.votos) {
          vencedor = candidato
        }
      }
      if (vencedor) {
        vencedorCidade.set(chave, {
          nr_votavel: vencedor.nr_votavel,
          nm_votavel: vencedor.nm_votavel,
          sg_partido: vencedor.sg_partido,
        })
      }
    }
    const ranking = secoes
      .map((secao, indice) => {
        const chave = `${secao.sg_uf}|${secao.cd_municipio_tse}`
        const vencedor = vencedorCidade.get(chave) ?? null
        return {
          ...secao,
          score_if: isolamento.scores[indice],
          score_lof: scoreLof.get(indice) ?? null,
          vencedor,
        }
      })
      .sort((a, b) => {
        if (query.ordenar_por === 'lof') {
          const la = a.score_lof ?? -Infinity;
          const lb = b.score_lof ?? -Infinity;
          if (lb !== la) return lb - la;
          return b.score_if - a.score_if;
        }
        return b.score_if - a.score_if;
      })
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

  app.get('/api/estatisticas', cacheado('estatisticas', 300, baseSchema.extend({
    escopo: z.enum(['turno', 'ano']).default('turno'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const irmaos = await eleicoesDoAno(db, { eleicao, cargo: query.cargo });
    const alvos = query.escopo === 'ano' && irmaos.length > 0 ? irmaos : [eleicao];
    const recorte = { cargo: query.cargo, corte, escopo: escopoDe(query) };

    const blocos = [];
    for (const alvo of alvos) {
      blocos.push(await estatisticasDaEleicao(db, { eleicao: alvo, ...recorte }));
    }

    return {
      corte: corteResposta(corte),
      escopo: query.escopo,
      turnos_disponiveis: irmaos.map((irmao) => irmao.nr_turno),
      blocos,
    };
  }));

  app.get('/api/map', cacheado('map', 300, baseSchema.extend({
    level: z.enum(['uf', 'municipio']).default('uf'),
    candidatos: z.string().optional(),
    as_of_anterior: z.string().optional(),
  }), async (query) => {
    const corte = resolverCorte(query);
    const corteAnterior = query.as_of_anterior ? resolverCorte({ as_of: query.as_of_anterior }) : null;
    const eleicao = await buscarEleicao(db, query.election_id);
    const candidatos = typeof query.candidatos === 'string' && query.candidatos.trim() !== ''
      ? query.candidatos
          .split(',')
          .map((valor) => Number(valor))
          .filter((valor) => Number.isInteger(valor) && valor !== 0 && !Number.isNaN(valor))
      : [];
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };

    const [areas, areasAnteriores, metadados, avisos] = await Promise.all([
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
      cache.obter('metadados', query, 300, () => metadadosCorte(db, escopo, corte)).then((r) => r.valor),
      cache.obter('avisos', query, 300, () => avisosCorte(db, escopo, corte)).then((r) => r.valor),
    ]);

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
      const candidatosComDelta = (area.candidatos ?? []).map((c) => {
        const ant = anterior?.candidatos?.find(
          (x) => Number(x.nr_votavel) === Number(c.nr_votavel),
        );
        const delta = ant
          ? Math.max(0, Number(c.qt_votos ?? 0) - Number(ant.qt_votos ?? 0))
          : Number(c.qt_votos ?? 0);
        return { ...c, qt_votos_delta: delta };
      });
      return { ...area, candidatos: candidatosComDelta };
    });

    return {
      level: query.level,
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      areas: areasComDelta,
    };
  }));

  app.get('/api/biometria/municipios', cacheado('biometria-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ordenar_por: z.enum(['nao_habilitada', 'percentual', 'comparecimento']).default('nao_habilitada'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const escopo = { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };

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

    const linhas = await qb
      .select([
        's.cd_municipio_tse',
        sql`max(l.nm_municipio)`.as('nm_municipio'),
        sql`coalesce(sum(bv.qt_comparecimento), 0)`.as('qt_comparecimento'),
        sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao), 0)`.as('qt_nao_habilitada'),
      ])
      .groupBy(['s.cd_municipio_tse', 's.sg_uf'])
      .orderBy(
        query.ordenar_por === 'percentual'
          ? sql`(coalesce(sum(bv.qt_elei_biom_sem_habilitacao),0)::float / nullif(sum(bv.qt_comparecimento),0)) desc nulls last`
          : query.ordenar_por === 'comparecimento'
            ? sql`coalesce(sum(bv.qt_comparecimento),0) desc`
            : sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao),0) desc`,
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
    ordenar_por: z.enum(['percentual', 'nao_habilitada', 'comparecimento']).default('percentual'),
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

    const linhas = await qb
      .select([
        's.id',
        's.nr_zona',
        's.nr_secao',
        sql`bv.qt_comparecimento`.as('qt_comparecimento'),
        sql`bv.qt_elei_biom_sem_habilitacao`.as('qt_nao_habilitada'),
      ])
      .orderBy(
        query.ordenar_por === 'nao_habilitada'
          ? sql`coalesce(bv.qt_elei_biom_sem_habilitacao,0) desc`
          : query.ordenar_por === 'comparecimento'
            ? sql`coalesce(bv.qt_comparecimento,0) desc`
            : sql`(coalesce(bv.qt_elei_biom_sem_habilitacao,0)::float / nullif(bv.qt_comparecimento,0)) desc nulls last`,
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

  app.get('/api/encerramento/urnas', cacheado('encerramento-urnas', 300, baseSchema, async (query) => {
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
        sql`count(*) filter (where coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) <= ${corte1715}::timestamptz)::int`.as('ate_1715'),
        sql`count(*) filter (where coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1715}::timestamptz and coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) <= ${corte1915}::timestamptz)::int`.as('ate_1915'),
        sql`count(*) filter (where coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1915}::timestamptz)::int`.as('apos_1915'),
      ])
      .groupBy('s.sg_uf')
      .orderBy('s.sg_uf')
      .execute();

    return {
      corte: corteResposta(corte),
      ufs: linhas.map((l) => {
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
    };
  }));

  app.get('/api/encerramento/municipios', cacheado('encerramento-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ordenar_por: z.enum(['apos_1715', 'apos_1915', 'total']).default('apos_1715'),
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

    const linhas = await qb
      .select([
        's.cd_municipio_tse',
        sql`max(l.nm_municipio)`.as('nm_municipio'),
        sql`count(*)::int`.as('total'),
        sql`count(*) filter (where coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1715}::timestamptz)::int`.as('apos_1715'),
        sql`(select rv.sg_partido from resultado_votavel rv join boletim_versao bv2 on bv2.id = rv.boletim_versao_id join secao_eleitoral s2 on s2.id = bv2.secao_id where s2.cd_municipio_tse = s.cd_municipio_tse and s2.sg_uf = s.sg_uf and bv2.eleicao_id = ${eleicao.id} and bv2.cd_cargo_pergunta = ${query.cargo} and bv2.ativo = true and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null group by rv.sg_partido order by sum(rv.qt_votos) desc limit 1)`.as('partido'),
        sql`(select coalesce(sum(rv.qt_votos),0) from resultado_votavel rv join boletim_versao bv2 on bv2.id = rv.boletim_versao_id join secao_eleitoral s2 on s2.id = bv2.secao_id where s2.cd_municipio_tse = s.cd_municipio_tse and s2.sg_uf = s.sg_uf and bv2.eleicao_id = ${eleicao.id} and bv2.cd_cargo_pergunta = ${query.cargo} and bv2.ativo = true and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null and rv.sg_partido = (select rv2.sg_partido from resultado_votavel rv2 join boletim_versao bv3 on bv3.id = rv2.boletim_versao_id join secao_eleitoral s3 on s3.id = bv3.secao_id where s3.cd_municipio_tse = s.cd_municipio_tse and s3.sg_uf = s.sg_uf and bv3.eleicao_id = ${eleicao.id} and bv3.cd_cargo_pergunta = ${query.cargo} and bv3.ativo = true and rv2.categoria in ('nominal','legenda') and rv2.qt_votos is not null group by rv2.sg_partido order by sum(rv2.qt_votos) desc limit 1))`.as('votos_partido'),
        sql`(select coalesce(sum(rv.qt_votos),0) from resultado_votavel rv join boletim_versao bv2 on bv2.id = rv.boletim_versao_id join secao_eleitoral s2 on s2.id = bv2.secao_id where s2.cd_municipio_tse = s.cd_municipio_tse and s2.sg_uf = s.sg_uf and bv2.eleicao_id = ${eleicao.id} and bv2.cd_cargo_pergunta = ${query.cargo} and bv2.ativo = true and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null)`.as('total_validos'),
      ])
      .groupBy(['s.cd_municipio_tse', 's.sg_uf'])
      .orderBy(
        query.ordenar_por === 'total'
          ? sql`count(*) desc`
          : sql`(count(*) filter (where coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1715}::timestamptz))::float / nullif(count(*),0) desc nulls last`,
      )
      .limit(query.limit)
      .execute();

    return {
      corte: corteResposta(corte),
      municipios: linhas.map((l) => {
        const total = Number(l.total);
        const apos = Number(l.apos_1715);
        return {
          cd_municipio_tse: l.cd_municipio_tse,
          nm_municipio: l.nm_municipio,
          total,
          apos_1715: apos,
          pct_apos_1715: total > 0 ? (apos / total) * 100 : null,
          partido: l.partido,
          votos: Number(l.votos_partido ?? 0),
          pct_votos: Number(l.total_validos) > 0 ? (Number(l.votos_partido) / Number(l.total_validos)) * 100 : null,
        };
      }),
    };
  }));

  app.get('/api/encerramento/secoes', cacheado('encerramento-secoes', 300, baseSchema.extend({
    uf: z.string().length(2),
    municipio: z.coerce.number().int(),
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

    const linhas = await qb
      .select([
        's.id',
        's.nr_zona',
        's.nr_secao',
        sql`coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts)`.as('dt_encerramento'),
        sql`case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1715}::timestamptz then true else false end`.as('apos_1715'),
        sql`(select rv.sg_partido from resultado_votavel rv where rv.boletim_versao_id = bv.id and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null group by rv.sg_partido order by sum(rv.qt_votos) desc limit 1)`.as('partido'),
        sql`(select coalesce(sum(rv.qt_votos),0) from resultado_votavel rv where rv.boletim_versao_id = bv.id and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null and rv.sg_partido = (select rv2.sg_partido from resultado_votavel rv2 where rv2.boletim_versao_id = bv.id and rv2.categoria in ('nominal','legenda') and rv2.qt_votos is not null group by rv2.sg_partido order by sum(rv2.qt_votos) desc limit 1))`.as('votos_partido'),
        sql`(select coalesce(sum(rv.qt_votos),0) from resultado_votavel rv where rv.boletim_versao_id = bv.id and rv.categoria in ('nominal','legenda') and rv.qt_votos is not null)`.as('total_validos'),
      ])
      .orderBy(sql`(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > ${corte1715}::timestamptz then 1 else 0 end) desc, coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) desc nulls last`)
      .limit(query.limit)
      .execute();

    return {
      corte: corteResposta(corte),
      secoes: linhas.map((l) => ({
        id: l.id,
        nr_zona: l.nr_zona,
        nr_secao: l.nr_secao,
        dt_encerramento: l.dt_encerramento,
        apos_1715: Boolean(l.apos_1715),
        partido: l.partido,
        votos: Number(l.votos_partido ?? 0),
        pct_votos: Number(l.total_validos) > 0 ? (Number(l.votos_partido) / Number(l.total_validos)) * 100 : null,
      })),
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
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const padrao = app.config?.SECTIONS_PAGE_SIZE_DEFAULT ?? 50;
    const maximo = app.config?.SECTIONS_PAGE_SIZE_MAX ?? 200;
    const pageSize = Math.min(query.page_size ?? padrao, maximo);

    const resultado = await consistenciaPorSecao(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    });

    const limitacoes = [
      'Consistência aritmética calculada a partir do BU ativo no corte selecionado.',
      'Campos ausentes (nulos) não são tratados como zero e não geram divergência.',
      'Biometria é agregada por seção, sem vínculo individual.',
      'A ferramenta não conclui fraude; sinaliza desvios para revisão.',
    ];

    const divergencias = [];
    for (const item of resultado.secoes) {
      for (const regra of item.regras) {
        if (regra.status !== 'divergente') continue;
        if (query.regra && regra.regra !== query.regra) continue;
        divergencias.push({
          secao: item.secao,
          regra: regra.regra,
          diferenca: regra.diferenca,
          campos: regra.campos,
          valores: regra.valores,
          bu: item.bu,
        });
      }
    }

    const [metadados, avisos] = await Promise.all([
      cache
        .obter('metadados', query, 300, () =>
          metadadosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
      cache
        .obter('avisos', query, 300, () =>
          avisosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
    ]);

    const inicio = (query.page - 1) * pageSize;
    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      cobertura: resultado.cobertura,
      limitacoes,
      page: query.page,
      page_size: pageSize,
      total: divergencias.length,
      itens: divergencias.slice(inicio, inicio + pageSize),
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
      cache
        .obter('metadados', query, 300, () =>
          metadadosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
      cache
        .obter('avisos', query, 300, () =>
          avisosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
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
      status: classificarStatusSecao(boletim, corte),
      boletim,
      resultados,
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

    const versoes = versoesRows.map((bv) => ({
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
      precisao: bv.precisao_dt_bu_recebido,
      precisao_dt_bu_recebido: bv.precisao_dt_bu_recebido,
      qt_aptos: bv.qt_aptos,
      qt_comparecimento: bv.qt_comparecimento,
      qt_abstencoes: bv.qt_abstencoes,
      qt_elei_biom_sem_habilitacao: bv.qt_elei_biom_sem_habilitacao,
      cd_tipo_urna: bv.cd_tipo_urna,
      ds_tipo_urna: bv.ds_tipo_urna,
      lote: loteMap.get(bv.lote_id) ? { id: loteMap.get(bv.lote_id).id, nome_arquivo: loteMap.get(bv.lote_id).nome_arquivo, sha256: loteMap.get(bv.lote_id).sha256 } : null,
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
    const comparacao = anterior && atual
      ? {
          anterior: anterior.versao,
          atual: atual.versao,
          ...compararVersoes(anterior, atual),
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
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const padrao = app.config?.SECTIONS_PAGE_SIZE_DEFAULT ?? 50;
    const maximo = app.config?.SECTIONS_PAGE_SIZE_MAX ?? 200;
    const pageSize = Math.min(query.page_size ?? padrao, maximo);

    const resultado = await comparacaoLocal(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    });

    const [metadados, avisos] = await Promise.all([
      cache
        .obter('metadados', query, 300, () =>
          metadadosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
      cache
        .obter('avisos', query, 300, () =>
          avisosCorte(db, { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) }, corte),
        )
        .then((r) => r.valor),
    ]);

    const grupos = resultado.grupos ?? [];
    const inicio = (query.page - 1) * pageSize;
    const limitacoes = [
      'Grupos formados por local de votação, com fallback para zona e município quando a amostra for insuficiente.',
      'Controle de escala por aptos (±50% da mediana do grupo).',
      'Métricas relativas: participação, abstenção e share por candidato.',
      'Ausência de campo não é tratada como zero.',
      'A ferramenta não define limiares de alerta; os resultados são descritivos.',
    ];

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      cobertura: resultado.cobertura,
      limitacoes,
      page: query.page,
      page_size: pageSize,
      total: grupos.length,
      grupos: grupos.slice(inicio, inicio + pageSize),
    };
  }));
}
