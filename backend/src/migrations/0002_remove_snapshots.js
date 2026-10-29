export async function up(db) {
  await db.schema.dropTable('snapshot_apuracao').ifExists().execute();
  await db.schema.dropTable('status_secoes_esperadas').ifExists().execute();
}

export async function down(db) {
  await db.schema.dropTable('snapshot_apuracao').ifExists().execute();
  await db.schema.dropTable('status_secoes_esperadas').ifExists().execute();
}
