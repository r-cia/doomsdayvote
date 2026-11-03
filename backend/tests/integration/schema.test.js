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
  'totalizacao_lote',
  'totalizacao_secao',
  'totalizacao_bu_voto',
  'totalizacao_rdv_voto',
  'totalizacao_eleitor',
  'totalizacao_incidente',
  'totalizacao_divergencia',
  'totalizacao_secao_erro',
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

  it('cria as tabelas de domínio', async () => {
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

  it('insere e consulta uma linha de cada tabela de totalização', async () => {
    const base = await criarBase();

    const lote = await db
      .insertInto('totalizacao_lote')
      .values({
        nome_arquivo: 'o03220rr0305000030241.zip',
        sg_uf: 'AC',
        ano_eleicao: 2026,
        nr_turno: 1,
        sha256: 'c'.repeat(64),
        iniciado_em: new Date('2026-10-04T20:55:00Z'),
        concluido_em: new Date('2026-10-04T21:00:00Z'),
        status: 'concluido',
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const secao = await db
      .insertInto('totalizacao_secao')
      .values({
        lote_id: lote.id,
        ano_eleicao: 2026,
        nr_turno: 1,
        sg_uf: 'AC',
        cd_municipio_tse: base.cdMunicipio,
        nr_zona: base.nrZona,
        nr_secao: base.nrSecao,
        nr_urna_efetivada: 2297435,
        nr_local_votacao: 1180,
        qt_aptos: 244,
        qt_comparecimento: 192,
        qt_abstencoes: 52,
        dt_abertura: new Date('2026-10-04T07:00:01Z'),
        dt_encerramento: new Date('2026-10-04T16:05:33Z'),
        dt_emissao_bu: new Date('2026-10-04T16:08:54Z'),
        qt_habilitacao_1: 13,
        qt_habilitacao_2: 174,
        qt_habilitacao_3: 5,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    await db
      .insertInto('totalizacao_bu_voto')
      .values({
        totalizacao_secao_id: secao.id,
        cd_cargo_pergunta: 6257,
        cd_tipo_votavel: 1,
        nr_votavel: 13,
        qt_votos: 30,
      })
      .execute();

    await db
      .insertInto('totalizacao_rdv_voto')
      .values({
        totalizacao_secao_id: secao.id,
        cd_cargo_pergunta: 6257,
        cd_tipo_votavel: 1,
        nr_votavel: 13,
        qt_votos: 30,
      })
      .execute();

    await db
      .insertInto('totalizacao_eleitor')
      .values({
        totalizacao_secao_id: secao.id,
        habilitado_em: new Date('2026-10-04T07:10:00Z'),
        computado_em: new Date('2026-10-04T07:10:02Z'),
        duracao_ms: 1200,
        qt_falhas_biometria: 1,
        tp_habilitacao: 2,
        qt_teclas_indevidas: 0,
        correcao: false,
      })
      .execute();

    await db
      .insertInto('totalizacao_incidente')
      .values({
        totalizacao_secao_id: secao.id,
        dt_incidente: new Date('2026-10-04T08:00:00Z'),
        nivel: 'erro',
        tipo: 'TESTE',
        texto_original: 'falha de teste',
      })
      .execute();

    await db
      .insertInto('totalizacao_divergencia')
      .values({
        lote_id: lote.id,
        fonte: 'rdv',
        campo: 'votos',
        sg_uf: 'AC',
        cd_municipio_tse: base.cdMunicipio,
        nr_zona: base.nrZona,
        nr_secao: base.nrSecao,
        cd_cargo_pergunta: 6257,
        nr_votavel: 13,
        valor_esperado: '30',
        valor_encontrado: '31',
      })
      .execute();

    const loteLido = await db
      .selectFrom('totalizacao_lote')
      .selectAll()
      .where('id', '=', lote.id)
      .executeTakeFirstOrThrow();
    expect(loteLido.status).toBe('concluido');

    const secaoLida = await db
      .selectFrom('totalizacao_secao')
      .selectAll()
      .where('id', '=', secao.id)
      .executeTakeFirstOrThrow();
    expect(Number(secaoLida.nr_urna_efetivada)).toBe(2297435);
    expect(Number(secaoLida.nr_local_votacao)).toBe(1180);
    expect(Number(secaoLida.qt_comparecimento)).toBe(192);
    expect(Number(secaoLida.qt_habilitacao_1)).toBe(13);
    expect(Number(secaoLida.qt_habilitacao_2)).toBe(174);
    expect(Number(secaoLida.qt_habilitacao_3)).toBe(5);

    const votoBu = await db
      .selectFrom('totalizacao_bu_voto')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .executeTakeFirstOrThrow();
    expect(Number(votoBu.nr_votavel)).toBe(13);
    expect(Number(votoBu.qt_votos)).toBe(30);

    const votoRdv = await db
      .selectFrom('totalizacao_rdv_voto')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .executeTakeFirstOrThrow();
    expect(Number(votoRdv.nr_votavel)).toBe(13);
    expect(Number(votoRdv.qt_votos)).toBe(30);

    const eleitor = await db
      .selectFrom('totalizacao_eleitor')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .executeTakeFirstOrThrow();
    expect(eleitor.correcao).toBe(false);
    expect(Number(eleitor.qt_falhas_biometria)).toBe(1);

    const incidente = await db
      .selectFrom('totalizacao_incidente')
      .selectAll()
      .where('totalizacao_secao_id', '=', secao.id)
      .executeTakeFirstOrThrow();
    expect(incidente.tipo).toBe('TESTE');
    expect(incidente.texto_original).toBe('falha de teste');

    const divergencia = await db
      .selectFrom('totalizacao_divergencia')
      .selectAll()
      .where('lote_id', '=', lote.id)
      .executeTakeFirstOrThrow();
    expect(divergencia.fonte).toBe('rdv');
    expect(divergencia.campo).toBe('votos');
    expect(divergencia.valor_esperado).toBe('30');
    expect(divergencia.valor_encontrado).toBe('31');
    expect(Number(divergencia.nr_votavel)).toBe(13);
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
    try {
      for (let rodada = 0; rodada < 2; rodada += 1) {
        const descida = await migrator.migrateTo(NO_MIGRATIONS);
        expect(descida.error).toBeUndefined();
        const subida = await migrator.migrateToLatest();
        expect(subida.error).toBeUndefined();
      }
    } finally {
      const restauracao = await migrator.migrateToLatest();
      expect(restauracao.error).toBeUndefined();
    }
  }, 180000);
});
