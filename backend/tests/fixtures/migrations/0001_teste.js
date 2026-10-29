export async function up(db) {
  await db.schema
    .createTable('tabela_teste_migracao')
    .addColumn('id', 'integer', (coluna) => coluna.primaryKey())
    .execute();
}

export async function down(db) {
  await db.schema.dropTable('tabela_teste_migracao').execute();
}
