import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  NO_MIGRATIONS,
  PostgresDialect,
  sql,
} from 'kysely';
import { DIRETORIO_MIGRACOES } from '../../src/db/migracoes.js';

const urlOwner = process.env.TEST_DATABASE_MIGRATION_URL;
const urlApp = process.env.TEST_DATABASE_URL;

if (!urlOwner || !urlApp) {
  throw new Error('TEST_DATABASE_MIGRATION_URL e TEST_DATABASE_URL precisam estar definidas');
}

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: urlOwner, options: '-c timezone=UTC' }),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({ fs, path, migrationFolder: DIRETORIO_MIGRACOES }),
});

const TABELAS = [
  'eleicao',
  'localidade',
  'secao_eleitoral',
  'lote_importacao',
  'boletim_versao',
  'resultado_votavel',
  'alerta_importacao',
  'malha_geografica',
  'partido_cor',
];

let sequencia = 0;

async function criarBase() {
  sequencia += 1;
  const numero = sequencia;
  const sha256 = String(numero).padStart(64, '0');

  const eleicao = await db
    .insertInto('eleicao')
    .values({
      ano_eleicao: 2026,
      cd_pleito: numero,
      nr_turno: 1,
      cd_eleicao: numero,
      nm_tipo_eleicao: 'Eleição Geral',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  await db
    .insertInto('localidade')
    .values({
      sg_uf: 'AC',
      cd_municipio_tse: 1000 + numero,
      nm_municipio: 'RIO BRANCO',
    })
    .execute();

  const secao = await db
    .insertInto('secao_eleitoral')
    .values({
      ano_eleicao: 2026,
      cd_pleito: numero,
      nr_turno: 1,
      sg_uf: 'AC',
      cd_municipio_tse: 1000 + numero,
      nr_zona: numero,
      nr_secao: numero,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  const lote = await db
    .insertInto('lote_importacao')
    .values({
      nome_arquivo: `bweb-ac-${numero}.csv`,
      caminho_armazenado: `originais/${sha256}.csv`,
      sha256,
      tamanho_bytes: 1000,
      captured_at: new Date('2026-10-04T21:00:00Z'),
      status: 'concluido',
      leiaute: 'BWEB_45',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return {
    eleicaoId: eleicao.id,
    secaoId: secao.id,
    loteId: lote.id,
    sha256,
    cdMunicipio: 1000 + numero,
    nrZona: numero,
    nrSecao: numero,
  };
}

function versao(base, overrides = {}) {
  return {
    eleicao_id: base.eleicaoId,
    secao_id: base.secaoId,
    cd_cargo_pergunta: 1,
    ds_cargo_pergunta: 'Presidente',
    lote_id: base.loteId,
    versao: 1,
    ativo: true,
    conteudo_sha256: 'b'.repeat(64),
    precisao_dt_bu_recebido: 'DATA_HORA',
    dt_bu_recebido_ts: new Date('2026-10-04T20:40:00Z'),
    ...overrides,
  };
}

describe('schema inicial', () => {
  beforeAll(async () => {
    const descida = await migrator.migrateTo(NO_MIGRATIONS);
    expect(descida.error).toBeUndefined();
    const subida = await migrator.migrateToLatest();
    expect(subida.error).toBeUndefined();
  }, 180000);

  afterAll(async () => {
    await db.destroy();
  });

  it('cria as nove tabelas de domínio', async () => {
    const { rows } = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `.execute(db);

    const existentes = rows.map((linha) => linha.table_name);
    for (const tabela of TABELAS) {
      expect(existentes).toContain(tabela);
    }
  });

  it('usa timestamptz para instantes e date para datas de negócio', async () => {
    const { rows } = await sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name, column_name) IN (
          ('boletim_versao', 'dt_bu_recebido_ts'),
          ('boletim_versao', 'dt_bu_recebido_data'),
          ('eleicao', 'dt_eleicao'),
          ('resultado_votavel', 'ano_eleicao'),
          ('resultado_votavel', 'nr_turno'),
          ('resultado_votavel', 'bruto')
        )
    `.execute(db);

    const tipos = Object.fromEntries(rows.map((linha) => [`${linha.table_name}.${linha.column_name}`, linha.data_type]));
    expect(tipos['boletim_versao.dt_bu_recebido_ts']).toBe('timestamp with time zone');
    expect(tipos['boletim_versao.dt_bu_recebido_data']).toBe('date');
    expect(tipos['eleicao.dt_eleicao']).toBe('date');
    expect(tipos['resultado_votavel.ano_eleicao']).toBe('smallint');
    expect(tipos['resultado_votavel.nr_turno']).toBe('smallint');
    expect(tipos['resultado_votavel.bruto']).toBeUndefined();
  });

  it('indexa ano e turno em resultado_votavel', async () => {    const { rows } = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'resultado_votavel'
        AND indexname IN (
          'resultado_votavel_eleicao_idx',
          'resultado_votavel_uf_cargo_idx'
        )
    `.execute(db);

    expect(rows.map((linha) => linha.indexname).sort()).toEqual([
      'resultado_votavel_eleicao_idx',
      'resultado_votavel_uf_cargo_idx',
    ]);
  });

  it('mantém a staging como tabela não logada', async () => {
    const { rows } = await sql`
      select relpersistence from pg_class where relname = 'bweb_staging'
    `.execute(db);

    expect(rows[0]?.relpersistence).toBe('u');
  });

  it('garante uma única versão ativa por BU', async () => {
    const base = await criarBase();

    await db.insertInto('boletim_versao').values(versao(base)).execute();
    await expect(
      db.insertInto('boletim_versao').values(versao(base, { versao: 2 })).execute(),
    ).rejects.toMatchObject({ code: '23505' });

    await db
      .updateTable('boletim_versao')
      .set({ ativo: false })
      .where('secao_id', '=', base.secaoId)
      .execute();
    await db.insertInto('boletim_versao').values(versao(base, { versao: 2 })).execute();
  });

  it('rejeita precisão temporal incoerente', async () => {
    const base = await criarBase();

    await expect(
      db
        .insertInto('boletim_versao')
        .values(
          versao(base, {
            precisao_dt_bu_recebido: 'DATA',
            dt_bu_recebido_ts: new Date('2026-10-04T20:40:00Z'),
          }),
        )
        .execute(),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      db
        .insertInto('boletim_versao')
        .values(
          versao(base, {
            precisao_dt_bu_recebido: 'AUSENTE',
            dt_bu_recebido_data: '2026-10-04',
          }),
        )
        .execute(),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      db
        .insertInto('boletim_versao')
        .values(
          versao(base, {
            precisao_dt_bu_recebido: 'DATA',
            dt_bu_recebido_ts: null,
            dt_bu_recebido_data: '2026-10-04',
          }),
        )
        .execute(),
    ).resolves.toBeDefined();
  });

  it('não duplica votável na mesma versão do BU', async () => {
    const base = await criarBase();
    const boletim = await db
      .insertInto('boletim_versao')
      .values(versao(base))
      .returning('id')
      .executeTakeFirstOrThrow();

    const resultado = {
      boletim_versao_id: boletim.id,
      cd_tipo_votavel: 1,
      categoria: 'nominal',
      nr_votavel: 13,
      lote_id: base.loteId,
      nr_linha_origem: 1,
      ano_eleicao: 2026,
      nr_turno: 1,
      sg_uf: 'AC',
      cd_municipio_tse: base.cdMunicipio,
      nr_zona: base.nrZona,
      nr_secao: base.nrSecao,
      cd_cargo_pergunta: 1,
    };

    await db.insertInto('resultado_votavel').values(resultado).execute();
    await expect(
      db.insertInto('resultado_votavel').values(resultado).execute(),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db
        .insertInto('resultado_votavel')
        .values({ ...resultado, cd_tipo_votavel: 2 })
        .execute(),
    ).resolves.toBeDefined();
  });

  it('rejeita sha256 repetido e turno inválido', async () => {
    const base = await criarBase();

    await expect(
      db
        .insertInto('lote_importacao')
        .values({
          nome_arquivo: 'bweb-ac-copia.csv',
          caminho_armazenado: 'originais/copia.csv',
          sha256: base.sha256,
          tamanho_bytes: 1000,
          captured_at: new Date(),
          status: 'concluido',
        })
        .execute(),
    ).rejects.toMatchObject({ code: '23505' });

    await expect(
      db
        .insertInto('eleicao')
        .values({ ano_eleicao: 2026, cd_pleito: 999, nr_turno: 3, cd_eleicao: 999 })
        .execute(),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('doomsday_app tem DML e não tem DDL', async () => {
    const base = await criarBase();
    const boletim = await db
      .insertInto('boletim_versao')
      .values(versao(base))
      .returning('id')
      .executeTakeFirstOrThrow();

    const cliente = new pg.Client({ connectionString: urlApp });
    await cliente.connect();

    await cliente.query(
      `INSERT INTO resultado_votavel
        (boletim_versao_id, cd_tipo_votavel, categoria, nr_votavel, lote_id, nr_linha_origem,
         ano_eleicao, nr_turno, sg_uf, cd_municipio_tse, nr_zona, nr_secao, cd_cargo_pergunta)
       VALUES ($1, 1, 'nominal', 13, $2, 1, 2026, 1, 'AC', $3, $4, $5, 1)`,
      [boletim.id, base.loteId, base.cdMunicipio, base.nrZona, base.nrSecao],
    );
    const selecionado = await cliente.query(
      'SELECT count(*)::int AS total FROM resultado_votavel WHERE boletim_versao_id = $1',
      [boletim.id],
    );
    expect(selecionado.rows[0].total).toBe(1);

    await cliente.query("UPDATE resultado_votavel SET nm_votavel = 'Candidato' WHERE nr_votavel = 13");
    await cliente.query('DELETE FROM resultado_votavel WHERE nr_votavel = 13');

    await expect(cliente.query('ALTER TABLE eleicao ADD COLUMN x int')).rejects.toMatchObject({
      code: '42501',
    });

    await cliente.end();
  });

  it('migrate:reset roda duas vezes seguidas', async () => {
    for (let rodada = 0; rodada < 2; rodada += 1) {
      const descida = await migrator.migrateTo(NO_MIGRATIONS);
      expect(descida.error).toBeUndefined();
      const subida = await migrator.migrateToLatest();
      expect(subida.error).toBeUndefined();
    }
  }, 180000);
});
