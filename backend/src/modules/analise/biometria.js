import { sql } from 'kysely';
import { aplicarFiltroCorte } from '../apuracao/corte.js';
import { ordenarSql } from '../../lib/ordenacao.js';

export async function biometriaPorMunicipio(db, { eleicaoId, cargo, corte, uf, ordenacao, limite }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  qb = aplicarFiltroCorte(qb, corte);
  qb = qb.where('s.sg_uf', '=', uf);

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
    ordenacao,
    ['s.cd_municipio_tse'],
  )
    .limit(limite)
    .execute();

  return linhas.map((linha) => {
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
  });
}

export async function biometriaPorSecao(db, { eleicaoId, cargo, corte, uf, municipio, ordenacao, limite }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  qb = aplicarFiltroCorte(qb, corte);
  qb = qb.where('s.sg_uf', '=', uf).where('s.cd_municipio_tse', '=', municipio);

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
    ordenacao,
    ['s.id'],
  )
    .limit(limite)
    .execute();

  return linhas.map((linha) => {
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
  });
}
