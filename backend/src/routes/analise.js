import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { baseSecaoCandidato, benfordDosNiveis, benfordPorCandidato, biometriaPorUf, composicaoBiometria, featuresDasSecoes } from '../modules/analise/estatisticas.js';
import { eleicoesDoAno, estatisticasDaEleicao } from '../modules/analise/descritivas.js';
import { COLUNAS_DUPLICACAO, duplicacaoPorAssinatura } from '../modules/analise/duplicacao.js';
import { consistenciaPorSecao } from '../modules/analise/consistencia.js';
import { comparacaoLocal } from '../modules/analise/comparacao-local.js';
import { COLUNAS_CONCENTRACAO, concentracao } from '../modules/analise/concentracao.js';
import { FEATURES, amostraLof, isolationForest, localOutlierFactor } from '../modules/analise/outliers.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao, escopoDaEleicao, escopoDe, metadadosEAvisos, tamanhoPagina } from './comum.js';

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

export function registrarAnalise({ app, db, cache, cacheado }) {
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
