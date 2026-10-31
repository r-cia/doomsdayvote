import { z } from 'zod';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { biometriaPorMunicipio, biometriaPorSecao } from '../modules/analise/biometria.js';
import { lerOrdenacao, ordenacaoSchema } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao } from './comum.js';

const CHAVES_BIOMETRIA_MUNICIPIOS = ['nm_municipio', 'qt_comparecimento', 'qt_nao_habilitada', 'percentual_nao_habilitada'];
const CHAVES_BIOMETRIA_SECOES = ['nr_zona', 'nr_secao', 'qt_comparecimento', 'qt_nao_habilitada', 'percentual_nao_habilitada'];

export function registrarBiometria({ app, db, cacheado }) {
  app.get('/api/biometria/municipios', cacheado('biometria-municipios', 300, baseSchema.extend({
    uf: z.string().length(2),
    ...ordenacaoSchema(CHAVES_BIOMETRIA_MUNICIPIOS),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const municipios = await biometriaPorMunicipio(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      uf: query.uf,
      ordenacao: lerOrdenacao(query, '', { ordem: 'qt_nao_habilitada', direcao: 'desc' }),
      limite: query.limit,
    });

    return { corte: corteResposta(corte), municipios };
  }));

  app.get('/api/biometria/secoes', cacheado('biometria-secoes', 300, baseSchema.extend({
    uf: z.string().length(2),
    municipio: z.coerce.number().int(),
    ...ordenacaoSchema(CHAVES_BIOMETRIA_SECOES),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secoes = await biometriaPorSecao(db, {
      eleicaoId: eleicao.id,
      cargo: query.cargo,
      corte,
      uf: query.uf,
      municipio: query.municipio,
      ordenacao: lerOrdenacao(query, '', { ordem: 'percentual_nao_habilitada', direcao: 'desc' }),
      limite: query.limit,
    });

    return { corte: corteResposta(corte), secoes };
  }));
}
