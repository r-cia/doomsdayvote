import { sql } from 'kysely';

export async function up(db) {
  await db.schema
    .createTable('totalizacao_intervencao')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('prefixo', 'text', (coluna) => coluna.notNull())
    .addColumn('fonte', 'text', (coluna) => coluna.notNull())
    .addColumn('posicao', 'text')
    .addColumn('tipo', 'text', (coluna) => coluna.notNull())
    .addColumn('descricao', 'text', (coluna) => coluna.notNull())
    .addColumn('impacto', 'text', (coluna) => coluna.notNull())
    .addColumn('registrado_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('totalizacao_intervencao_fonte_check', sql`fonte in ('BU', 'RDV', 'LOG')`)
    .addForeignKeyConstraint(
      'totalizacao_intervencao_lote_fk',
      ['lote_id'],
      'totalizacao_lote',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_intervencao_lote_idx')
    .on('totalizacao_intervencao')
    .columns(['lote_id', 'prefixo'])
    .execute();
}

export async function down(db) {
  await db.schema.dropTable('totalizacao_intervencao').execute();
}
