export async function up(db) {
  await db.schema
    .createIndex('totalizacao_divergencia_ordem_idx')
    .on('totalizacao_divergencia')
    .columns([
      'lote_id',
      'sg_uf',
      'cd_municipio_tse',
      'nr_zona',
      'nr_secao',
      'fonte',
      'campo',
      'id',
    ])
    .execute();
}

export async function down(db) {
  await db.schema.dropIndex('totalizacao_divergencia_ordem_idx').execute();
}
