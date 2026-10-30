import { sql } from 'kysely';

export async function up(db) {
  // boletim_versao: cobre aplicarFiltroCorte + aplicarEscopo (eleicao/cargo/ativo/precisao/recebimento)
  await db.schema
    .createIndex('boletim_versao_eleicao_cargo_recebimento_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'precisao_dt_bu_recebido', 'dt_bu_recebido_ts'])
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createIndex('boletim_versao_eleicao_cargo_data_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'dt_bu_recebido_data'])
    .where(sql`ativo`)
    .execute();

  // boletim_versao: join por secao
  await db.schema
    .createIndex('boletim_versao_secao_ativo_idx')
    .on('boletim_versao')
    .columns(['secao_id', 'eleicao_id', 'cd_cargo_pergunta'])
    .where(sql`ativo`)
    .execute();

  // resultado_votavel: join por boletim + agregacao por candidato/categoria
  await db.schema
    .createIndex('resultado_votavel_boletim_categoria_idx')
    .on('resultado_votavel')
    .columns(['boletim_versao_id', 'categoria', 'nr_votavel'])
    .execute();

  // secao_eleitoral: join por localidade e filtro por UF/municipio
  await db.schema
    .createIndex('secao_eleitoral_localidade_full_idx')
    .on('secao_eleitoral')
    .columns(['sg_uf', 'cd_municipio_tse'])
    .execute();

  // lote_importacao: lookup por id (PK ja existe, mas reforca)
  await sql`ANALYZE boletim_versao, resultado_votavel, secao_eleitoral`.execute(db);
}

export async function down(db) {
  await db.schema.dropIndex('secao_eleitoral_localidade_full_idx').execute();
  await db.schema.dropIndex('resultado_votavel_boletim_categoria_idx').execute();
  await db.schema.dropIndex('boletim_versao_secao_ativo_idx').execute();
  await db.schema.dropIndex('boletim_versao_eleicao_cargo_data_idx').execute();
  await db.schema.dropIndex('boletim_versao_eleicao_cargo_recebimento_idx').execute();
}