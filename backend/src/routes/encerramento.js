import { z } from 'zod';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { DERIVADAS_PARTIDO, encerramentoPorMunicipio, encerramentoPorSecao, encerramentoPorUf } from '../modules/analise/encerramento.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao } from './comum.js';

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

const CHAVES_ENCERRAMENTO_MUNICIPIOS = ['nm_municipio', 'total', 'apos_1715', 'pct_apos_1715', ...Object.keys(DERIVADAS_PARTIDO)];
const CHAVES_ENCERRAMENTO_SECOES = ['nr_zona', 'nr_secao', 'dt_encerramento', ...Object.keys(DERIVADAS_PARTIDO)];

export function registrarEncerramento({ app, db, cacheado }) {
  app.get('/api/encerramento/urnas', cacheado('encerramento-urnas', 300, baseSchema.extend(ordenacaoSchema(Object.keys(COLUNAS_ENCERRAMENTO_URNAS))), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const ufs = await encerramentoPorUf(db, { eleicao, cargo: query.cargo, corte });

    return {
      corte: corteResposta(corte),
      ufs: ordenarLista(ufs, COLUNAS_ENCERRAMENTO_URNAS, lerOrdenacao(query)),
    };
  }));

  app.get('/api/encerramento/municipios', cacheado('encerramento-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ...ordenacaoSchema(CHAVES_ENCERRAMENTO_MUNICIPIOS),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const municipios = await encerramentoPorMunicipio(db, {
      eleicao,
      cargo: query.cargo,
      corte,
      uf: query.uf,
      ordenacao: lerOrdenacao(query, '', { ordem: 'pct_apos_1715', direcao: 'desc' }),
      limite: query.limit,
    });

    return { corte: corteResposta(corte), municipios };
  }));

  app.get('/api/encerramento/secoes', cacheado('encerramento-secoes', 300, baseSchema.extend({
    uf: z.string().length(2),
    municipio: z.coerce.number().int(),
    ...ordenacaoSchema(CHAVES_ENCERRAMENTO_SECOES),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secoes = await encerramentoPorSecao(db, {
      eleicao,
      cargo: query.cargo,
      corte,
      uf: query.uf,
      municipio: query.municipio,
      ordenacao: lerOrdenacao(query),
      limite: query.limit,
    });

    return { corte: corteResposta(corte), secoes };
  }));
}
