import { sql } from 'kysely';

export async function up(db) {
  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO doomsday_app`.execute(db);
  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO doomsday_app`.execute(db);

  await db.schema
    .createTable('eleicao')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('ano_eleicao', 'integer', (coluna) => coluna.notNull())
    .addColumn('cd_pleito', 'integer', (coluna) => coluna.notNull())
    .addColumn('dt_pleito', 'date')
    .addColumn('dt_eleicao', 'date')
    .addColumn('nr_turno', 'smallint', (coluna) => coluna.notNull())
    .addColumn('cd_eleicao', 'integer', (coluna) => coluna.notNull())
    .addColumn('cd_tipo_eleicao', 'integer')
    .addColumn('nm_tipo_eleicao', 'text')
    .addColumn('ds_eleicao', 'text')
    .addColumn('fonte', 'text', (coluna) => coluna.notNull().defaultTo('BWEB'))
    .addColumn('metadados_derivados', sql`text[]`, (coluna) => coluna.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('created_at', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('eleicao_nr_turno_check', sql`nr_turno in (1, 2)`)
    .addUniqueConstraint('eleicao_chave_unica', ['ano_eleicao', 'cd_pleito', 'cd_eleicao', 'nr_turno'])
    .execute();

  await db.schema
    .createTable('localidade')
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer', (coluna) => coluna.notNull())
    .addColumn('nm_municipio', 'text', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_ibge', 'integer', (coluna) => coluna.unique())
    .addColumn('regiao', 'text')
    .addColumn('geom_id', 'text')
    .addPrimaryKeyConstraint('localidade_pk', ['sg_uf', 'cd_municipio_tse'])
    .execute();

  await db.schema
    .createTable('secao_eleitoral')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('ano_eleicao', 'integer', (coluna) => coluna.notNull())
    .addColumn('cd_pleito', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_turno', 'smallint', (coluna) => coluna.notNull())
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_zona', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_secao', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_local_votacao', 'integer')
    .addColumn('ds_secoes_agregadas', 'text')
    .addForeignKeyConstraint(
      'secao_eleitoral_localidade_fk',
      ['sg_uf', 'cd_municipio_tse'],
      'localidade',
      ['sg_uf', 'cd_municipio_tse'],
    )
    .addUniqueConstraint('secao_eleitoral_chave_unica', [
      'ano_eleicao',
      'cd_pleito',
      'nr_turno',
      'sg_uf',
      'cd_municipio_tse',
      'nr_zona',
      'nr_secao',
    ])
    .execute();

  await db.schema
    .createTable('lote_importacao')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('nome_arquivo', 'text', (coluna) => coluna.notNull())
    .addColumn('caminho_armazenado', 'text', (coluna) => coluna.notNull())
    .addColumn('sha256', 'char(64)', (coluna) => coluna.notNull().unique())
    .addColumn('tamanho_bytes', 'bigint', (coluna) => coluna.notNull())
    .addColumn('leiaute', 'text')
    .addColumn('origem', 'text', (coluna) => coluna.notNull().defaultTo('pasta_local'))
    .addColumn('dt_geracao_arquivo', 'timestamptz')
    .addColumn('captured_at', 'timestamptz', (coluna) => coluna.notNull())
    .addColumn('started_at', 'timestamptz')
    .addColumn('imported_at', 'timestamptz')
    .addColumn('duracao_ms', 'integer')
    .addColumn('qt_linhas', 'integer')
    .addColumn('qt_linhas_importadas', 'integer')
    .addColumn('qt_erros', 'integer', (coluna) => coluna.notNull().defaultTo(0))
    .addColumn('qt_alertas', 'integer', (coluna) => coluna.notNull().defaultTo(0))
    .addColumn('status', 'text', (coluna) => coluna.notNull())
    .addColumn('erro_codigo', 'text')
    .addColumn('erro_mensagem', 'text')
    .addColumn('metadados', 'jsonb', (coluna) => coluna.notNull().defaultTo(sql`'{}'::jsonb`))
    .addCheckConstraint(
      'lote_importacao_leiaute_check',
      sql`leiaute in ('BWEB_2014_31', 'BWEB_2018_42', 'BWEB_45')`,
    )
    .addCheckConstraint(
      'lote_importacao_status_check',
      sql`status in ('processando', 'concluido', 'falhou')`,
    )
    .execute();

  await db.schema
    .createTable('boletim_versao')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('eleicao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('secao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_cargo_pergunta', 'integer', (coluna) => coluna.notNull())
    .addColumn('ds_cargo_pergunta', 'text', (coluna) => coluna.notNull())
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('versao', 'integer', (coluna) => coluna.notNull())
    .addColumn('ativo', 'boolean', (coluna) => coluna.notNull())
    .addColumn('substitui_versao_id', 'uuid')
    .addColumn('conteudo_sha256', 'char(64)', (coluna) => coluna.notNull())
    .addColumn('dt_geracao', 'timestamptz')
    .addColumn('dt_abertura', 'timestamptz')
    .addColumn('dt_encerramento', 'timestamptz')
    .addColumn('dt_emissao_bu', 'timestamptz')
    .addColumn('dt_bu_recebido_ts', 'timestamptz')
    .addColumn('dt_bu_recebido_data', 'date')
    .addColumn('precisao_dt_bu_recebido', 'text', (coluna) => coluna.notNull())
    .addColumn('qt_aptos', 'integer')
    .addColumn('qt_comparecimento', 'integer')
    .addColumn('qt_abstencoes', 'integer')
    .addColumn('qt_elei_biom_sem_habilitacao', 'integer')
    .addColumn('cd_tipo_urna', 'integer')
    .addColumn('ds_tipo_urna', 'text')
    .addColumn('nr_urna_efetivada', 'integer')
    .addColumn('cd_carga_1_urna_efetivada', 'text')
    .addColumn('cd_carga_2_urna_efetivada', 'text')
    .addColumn('cd_flashcard_urna_efetivada', 'text')
    .addColumn('dt_carga_urna_efetivada', 'text')
    .addColumn('nr_junta_apuradora', 'integer')
    .addColumn('nr_turma_apuradora', 'integer')
    .addColumn('imported_at', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addForeignKeyConstraint('boletim_versao_eleicao_fk', ['eleicao_id'], 'eleicao', ['id'])
    .addForeignKeyConstraint('boletim_versao_secao_fk', ['secao_id'], 'secao_eleitoral', ['id'])
    .addForeignKeyConstraint('boletim_versao_lote_fk', ['lote_id'], 'lote_importacao', ['id'])
    .addForeignKeyConstraint(
      'boletim_versao_substitui_fk',
      ['substitui_versao_id'],
      'boletim_versao',
      ['id'],
    )
    .addUniqueConstraint('boletim_versao_chave_unica', [
      'eleicao_id',
      'secao_id',
      'cd_cargo_pergunta',
      'versao',
    ])
    .addCheckConstraint(
      'boletim_versao_precisao_check',
      sql`(precisao_dt_bu_recebido = 'DATA_HORA' AND dt_bu_recebido_ts IS NOT NULL AND dt_bu_recebido_data IS NULL)
        OR (precisao_dt_bu_recebido = 'DATA' AND dt_bu_recebido_data IS NOT NULL AND dt_bu_recebido_ts IS NULL)
        OR (precisao_dt_bu_recebido = 'AUSENTE' AND dt_bu_recebido_ts IS NULL AND dt_bu_recebido_data IS NULL)`,
    )
    .execute();

  await db.schema
    .createIndex('boletim_versao_ativa_unica')
    .on('boletim_versao')
    .columns(['eleicao_id', 'secao_id', 'cd_cargo_pergunta'])
    .unique()
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createTable('resultado_votavel')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('boletim_versao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_tipo_votavel', 'integer', (coluna) => coluna.notNull())
    .addColumn('ds_tipo_votavel', 'text')
    .addColumn('categoria', 'text', (coluna) => coluna.notNull())
    .addColumn('nr_votavel', 'integer', (coluna) => coluna.notNull())
    .addColumn('nm_votavel', 'text')
    .addColumn('nr_partido', 'integer')
    .addColumn('sg_partido', 'text')
    .addColumn('nm_partido', 'text')
    .addColumn('qt_votos', 'integer')
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('nr_linha_origem', 'integer', (coluna) => coluna.notNull())
    .addColumn('bruto', 'jsonb', (coluna) => coluna.notNull())
    .addForeignKeyConstraint(
      'resultado_votavel_boletim_fk',
      ['boletim_versao_id'],
      'boletim_versao',
      ['id'],
    )
    .addForeignKeyConstraint('resultado_votavel_lote_fk', ['lote_id'], 'lote_importacao', ['id'])
    .addUniqueConstraint('resultado_votavel_chave_unica', [
      'boletim_versao_id',
      'cd_tipo_votavel',
      'nr_votavel',
    ])
    .addCheckConstraint(
      'resultado_votavel_categoria_check',
      sql`categoria in ('nominal', 'legenda', 'branco', 'nulo', 'anulado_apurado_separado', 'anulado', 'outro')`,
    )
    .execute();

  await db.schema
    .createTable('alerta_importacao')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('severidade', 'text', (coluna) => coluna.notNull())
    .addColumn('codigo', 'text', (coluna) => coluna.notNull())
    .addColumn('mensagem', 'text', (coluna) => coluna.notNull())
    .addColumn('nr_linha', 'integer')
    .addColumn('campo', 'text')
    .addColumn('contexto', 'jsonb', (coluna) => coluna.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (coluna) => coluna.defaultTo(sql`now()`))
    .addForeignKeyConstraint('alerta_importacao_lote_fk', ['lote_id'], 'lote_importacao', ['id'])
    .addCheckConstraint(
      'alerta_importacao_severidade_check',
      sql`severidade in ('erro', 'alerta')`,
    )
    .execute();

  await db.schema
    .createTable('partido_cor')
    .addColumn('sg_partido', 'text', (coluna) => coluna.primaryKey())
    .addColumn('cor_hex', 'char(7)', (coluna) => coluna.notNull())
    .addColumn('fonte', 'text', (coluna) => coluna.notNull())
    .addColumn('atualizado_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('partido_cor_cor_hex_check', sql`cor_hex ~ '^#[0-9A-Fa-f]{6}$'`)
    .execute();

  await db.schema
    .createTable('malha_geografica')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('nivel', 'text', (coluna) => coluna.notNull())
    .addColumn('versao', 'text', (coluna) => coluna.notNull())
    .addColumn('fonte', 'text', (coluna) => coluna.notNull())
    .addColumn('arquivo', 'text', (coluna) => coluna.notNull())
    .addColumn('sha256', 'char(64)', (coluna) => coluna.notNull())
    .addColumn('qt_features', 'integer', (coluna) => coluna.notNull())
    .addColumn('carregada_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('malha_geografica_nivel_check', sql`nivel in ('uf', 'municipio')`)
    .addUniqueConstraint('malha_geografica_chave_unica', ['nivel', 'versao'])
    .execute();

  await db.schema
    .createIndex('secao_eleitoral_localidade_idx')
    .on('secao_eleitoral')
    .columns(['sg_uf', 'cd_municipio_tse', 'nr_zona'])
    .execute();

  await db.schema
    .createIndex('boletim_versao_recebimento_ts_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'dt_bu_recebido_ts'])
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createIndex('boletim_versao_recebimento_data_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'dt_bu_recebido_data'])
    .where(sql`ativo`)
    .execute();

  await db.schema.createIndex('boletim_versao_secao_idx').on('boletim_versao').column('secao_id').execute();
  await db.schema.createIndex('boletim_versao_lote_idx').on('boletim_versao').column('lote_id').execute();
  await db.schema
    .createIndex('resultado_votavel_boletim_idx')
    .on('resultado_votavel')
    .column('boletim_versao_id')
    .execute();
  await db.schema
    .createIndex('alerta_importacao_lote_codigo_idx')
    .on('alerta_importacao')
    .columns(['lote_id', 'codigo'])
    .execute();

  await sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO doomsday_app`.execute(db);
  await sql`GRANT SELECT ON TABLE kysely_migration TO doomsday_app`.execute(db);
  await sql`GRANT SELECT ON TABLE kysely_migration_lock TO doomsday_app`.execute(db);
}

export async function down(db) {
  await db.schema.dropTable('resultado_votavel').execute();
  await db.schema.dropTable('alerta_importacao').execute();
  await db.schema.dropTable('boletim_versao').execute();
  await db.schema.dropTable('lote_importacao').execute();
  await db.schema.dropTable('secao_eleitoral').execute();
  await db.schema.dropTable('localidade').execute();
  await db.schema.dropTable('eleicao').execute();
  await db.schema.dropTable('partido_cor').execute();
  await db.schema.dropTable('malha_geografica').execute();
}
