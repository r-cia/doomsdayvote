import { sql } from 'kysely';

export async function up(db) {
  await db.schema
    .createIndex('totalizacao_incidente_instante_idx')
    .on('totalizacao_incidente')
    .expression(sql`dt_incidente desc, id desc`)
    .execute();
}

export async function down(db) {
  await db.schema.dropIndex('totalizacao_incidente_instante_idx').execute();
}
