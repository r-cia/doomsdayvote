export async function up(db) {
  await db.schema
    .createTable('totalizacao_zona_metrica')
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_zona', 'integer', (coluna) => coluna.notNull())
    .addColumn('qt_secoes', 'integer', (coluna) => coluna.notNull())
    .addColumn('qt_aptos', 'bigint', (coluna) => coluna.notNull())
    .addColumn('qt_comparecimento', 'bigint', (coluna) => coluna.notNull())
    .addColumn('qt_duracao', 'bigint', (coluna) => coluna.notNull())
    .addColumn('soma_duracao_ms', 'bigint', (coluna) => coluna.notNull())
    .addColumn('min_duracao_ms', 'integer')
    .addColumn('max_duracao_ms', 'integer')
    .addColumn('falhou_1', 'integer', (coluna) => coluna.notNull())
    .addColumn('falhou_2', 'integer', (coluna) => coluna.notNull())
    .addColumn('falhou_3', 'integer', (coluna) => coluna.notNull())
    .addColumn('falhou_4', 'integer', (coluna) => coluna.notNull())
    .addColumn('manual', 'integer', (coluna) => coluna.notNull())
    .addColumn('teclas_indevidas', 'bigint', (coluna) => coluna.notNull())
    .addColumn('correcoes', 'integer', (coluna) => coluna.notNull())
    .addColumn('qt_incidentes', 'integer', (coluna) => coluna.notNull())
    .addPrimaryKeyConstraint('totalizacao_zona_metrica_pk', [
      'lote_id',
      'cd_municipio_tse',
      'nr_zona',
    ])
    .addForeignKeyConstraint(
      'totalizacao_zona_metrica_lote_fk',
      ['lote_id'],
      'totalizacao_lote',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createTable('totalizacao_zona_duracao')
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_zona', 'integer', (coluna) => coluna.notNull())
    .addColumn('segundo', 'integer', (coluna) => coluna.notNull())
    .addColumn('qt', 'integer', (coluna) => coluna.notNull())
    .addColumn('soma_ms', 'bigint', (coluna) => coluna.notNull())
    .addPrimaryKeyConstraint('totalizacao_zona_duracao_pk', [
      'lote_id',
      'cd_municipio_tse',
      'nr_zona',
      'segundo',
    ])
    .addForeignKeyConstraint(
      'totalizacao_zona_duracao_lote_fk',
      ['lote_id'],
      'totalizacao_lote',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();
}

export async function down(db) {
  await db.schema.dropTable('totalizacao_zona_duracao').execute();
  await db.schema.dropTable('totalizacao_zona_metrica').execute();
}
