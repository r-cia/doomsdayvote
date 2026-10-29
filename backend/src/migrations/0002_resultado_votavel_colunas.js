import { sql } from 'kysely';

const COLUNAS = [
  ['ano_eleicao', 'smallint'],
  ['nr_turno', 'smallint'],
  ['sg_uf', 'varchar(2)'],
  ['cd_municipio_tse', 'integer'],
  ['nr_zona', 'integer'],
  ['nr_secao', 'integer'],
  ['cd_cargo_pergunta', 'integer'],
];

const LOTE = 50000;

export async function up(db) {
  for (const [nome, tipo] of COLUNAS) {
    await db.schema
      .alterTable('resultado_votavel')
      .addColumn(nome, tipo)
      .execute();
  }

  let atualizados = 1;
  while (atualizados > 0) {
    const resultado = await sql`
      with alvo as (
        select id from resultado_votavel where ano_eleicao is null limit ${LOTE}
      )
      update resultado_votavel rv
      set ano_eleicao = s.ano_eleicao,
          nr_turno = s.nr_turno,
          sg_uf = s.sg_uf,
          cd_municipio_tse = s.cd_municipio_tse,
          nr_zona = s.nr_zona,
          nr_secao = s.nr_secao,
          cd_cargo_pergunta = bv.cd_cargo_pergunta
      from alvo, boletim_versao bv, secao_eleitoral s
      where rv.id = alvo.id
        and bv.id = rv.boletim_versao_id
        and s.id = bv.secao_id
    `.execute(db);
    atualizados = Number(resultado.numAffectedRows ?? 0n);
  }

  for (const [nome] of COLUNAS) {
    const restricao = `resultado_votavel_${nome}_nao_nulo`;
    await sql`
      alter table resultado_votavel
      add constraint ${sql.id(restricao)}
      check (${sql.id(nome)} is not null) not valid
    `.execute(db);
    await sql`
      alter table resultado_votavel validate constraint ${sql.id(restricao)}
    `.execute(db);
    await sql`
      alter table resultado_votavel alter column ${sql.id(nome)} set not null
    `.execute(db);
    await sql`
      alter table resultado_votavel drop constraint ${sql.id(restricao)}
    `.execute(db);
  }

  await db.schema.alterTable('resultado_votavel').dropColumn('bruto').execute();

  await db.schema
    .createIndex('resultado_votavel_eleicao_idx')
    .on('resultado_votavel')
    .columns(['ano_eleicao', 'nr_turno'])
    .execute();

  await db.schema
    .createIndex('resultado_votavel_uf_cargo_idx')
    .on('resultado_votavel')
    .columns(['ano_eleicao', 'nr_turno', 'sg_uf', 'cd_cargo_pergunta'])
    .execute();
}

export async function down(db) {
  await db.schema
    .dropIndex('resultado_votavel_uf_cargo_idx')
    .ifExists()
    .execute();
  await db.schema.dropIndex('resultado_votavel_eleicao_idx').ifExists().execute();

  await db.schema
    .alterTable('resultado_votavel')
    .addColumn('bruto', 'jsonb')
    .execute();

  for (const [nome] of COLUNAS) {
    await db.schema.alterTable('resultado_votavel').dropColumn(nome).execute();
  }
}
