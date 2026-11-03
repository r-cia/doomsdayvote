import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { COLUNAS_SECOES, buscarSecao, detalheDoBoletim, listarSecoes, versoesDaSecao } from '../modules/apuracao/secoes.js';
import { horariosDoBu } from '../modules/apuracao/status-secao.js';
import { validarConsistenciaBu } from '../modules/analise/consistencia.js';
import { compararVersoes } from '../modules/analise/versoes-bu.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao, corteSchema, escopoDaEleicao, metadadosEAvisos, tamanhoPagina } from './comum.js';

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

export function registrarSecoes({ app, db, cache, cacheado }) {
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

    const { itens, total } = await listarSecoes(db, {
      eleicao,
      cargo: query.cargo,
      corte,
      filtros: query,
      ordenacao: lerOrdenacao(query),
      pagina: query.page,
      tamanhoPagina: pageSize,
    });

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

    const secao = await buscarSecao(db, query.id);
    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const { boletim, statusBu, resultados, lote, anteriores } = await detalheDoBoletim(db, {
      eleicaoId: eleicao.id,
      secaoId: query.id,
      cargo: query.cargo,
      corte,
    });

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

    const secao = await buscarSecao(db, query.id);
    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const versoes = await versoesDaSecao(db, { eleicaoId: eleicao.id, secaoId: query.id, cargo: query.cargo });

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
}
