import { sql } from 'kysely';
import { z } from 'zod';
import { aplicarFiltroCorte, corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { lerOrdenacao, ordenacaoSchema, ordenarSql } from '../lib/ordenacao.js';
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
}
