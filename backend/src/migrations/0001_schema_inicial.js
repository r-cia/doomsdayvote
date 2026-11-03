import { sql } from 'kysely';

const COLUNAS_RESULTADO = [
  ['ano_eleicao', 'smallint'],
  ['nr_turno', 'smallint'],
  ['sg_uf', 'varchar(2)'],
  ['cd_municipio_tse', 'integer'],
  ['nr_zona', 'integer'],
  ['nr_secao', 'integer'],
  ['cd_cargo_pergunta', 'integer'],
];

const LOTE_BACKFILL = 50000;

const SIGLA_COM_FALLBACK = 'coalesce(rv.sg_partido, rv.nm_partido)';
const SIGLA_ORIGINAL = 'rv.sg_partido';

async function recriarVotosFinal(db, sigla) {
  await sql`drop materialized view if exists mv_votos_final`.execute(db);
  await sql`
    create materialized view mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(${sql.raw(sigla)}) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) <= (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_ate_1715,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_tardios
    from boletim_versao bv
    join eleicao e on e.id = bv.eleicao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);
  await sql`create unique index mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`analyze mv_votos_final`.execute(db);
  await sql`grant select on mv_votos_final to doomsday_app`.execute(db);
}

async function recriarTotaisArea(db, sigla) {
  await sql`drop materialized view if exists mv_totais_area`.execute(db);
  await sql`
    create materialized view mv_totais_area as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      s.sg_uf,
      s.cd_municipio_tse,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(${sql.raw(sigla)}) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      max(l.geom_id) as geom_id,
      max(l.nm_municipio) as nm_municipio,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, s.sg_uf, s.cd_municipio_tse, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);
  await sql`create unique index mv_totais_area_pk on mv_totais_area (eleicao_id, cargo, sg_uf, cd_municipio_tse, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index mv_totais_area_eleicao_idx on mv_totais_area (eleicao_id, cargo, sg_uf)`.execute(db);
  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`analyze mv_totais_area`.execute(db);
  await sql`grant select on mv_totais_area to doomsday_app`.execute(db);
}

async function recriarSecaoCandidatoFinal(db, sigla) {
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);
  await sql`
    create materialized view mv_secao_candidato_final as
    with linhas as (
      select
        bv.eleicao_id,
        bv.cd_cargo_pergunta as cargo,
        bv.secao_id,
        rv.nr_votavel,
        rv.cd_tipo_votavel,
        rv.categoria,
        max(rv.nm_votavel) as nm_votavel,
        max(${sql.raw(sigla)}) as sg_partido,
        max(s.sg_uf) as sg_uf,
        max(s.cd_municipio_tse) as cd_municipio_tse,
        max(l.nm_municipio) as nm_municipio,
        max(s.nr_zona) as nr_zona,
        max(s.nr_secao) as nr_secao,
        max(s.nr_local_votacao) as nr_local_votacao,
        max(bv.qt_aptos) as qt_aptos,
        max(bv.qt_comparecimento) as qt_comparecimento,
        max(bv.qt_abstencoes) as qt_abstencoes,
        max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
        max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts,
        sum(rv.qt_votos)::bigint as votos
      from boletim_versao bv
      join secao_eleitoral s on s.id = bv.secao_id
      join resultado_votavel rv on rv.boletim_versao_id = bv.id
      left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
      where bv.ativo = true
        and bv.cd_tipo_urna = 1
        and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
        and rv.qt_votos is not null
      group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    )
    select
      linhas.*,
      (sum(votos) filter (where categoria in ('nominal', 'legenda')) over secao)::bigint as validos,
      md5(string_agg(cd_tipo_votavel::text || ':' || nr_votavel::text || ':' || votos::text, '|')
        over (secao order by cd_tipo_votavel, nr_votavel rows between unbounded preceding and unbounded following)) as assinatura,
      count(*) over secao as votaveis
    from linhas
    window secao as (partition by eleicao_id, cargo, secao_id)
    with no data
  `.execute(db);
  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, cd_tipo_votavel, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);
}

async function recriarViews(db, sigla) {
  await recriarVotosFinal(db, sigla);
  await recriarTotaisArea(db, sigla);
  await recriarSecaoCandidatoFinal(db, sigla);
}

export async function preencherSiglaExterior(db) {
  await sql`
    update resultado_votavel rv
    set sg_partido = m.sg_partido
    from (
      select e.ano_eleicao, e.nr_turno, v.nr_partido, min(v.sg_partido) as sg_partido
      from mv_votos_final v
      join eleicao e on e.id = v.eleicao_id
      where e.ano_eleicao = 2014 and v.nr_partido is not null and v.sg_partido is not null
      group by e.ano_eleicao, e.nr_turno, v.nr_partido
      having count(distinct v.sg_partido) = 1
    ) m
    where rv.ano_eleicao = 2014
      and rv.sg_uf = 'ZZ'
      and rv.sg_partido is null
      and rv.nm_partido is null
      and rv.nr_partido is not null
      and rv.nr_turno = m.nr_turno
      and rv.nr_partido = m.nr_partido
  `.execute(db);
}

async function atualizarViews(db) {
  await sql`refresh materialized view concurrently mv_votos_final`.execute(db);
  await sql`refresh materialized view concurrently mv_totais_area`.execute(db);
  await sql`refresh materialized view concurrently mv_secao_candidato_final`.execute(db);
}

function definicaoViewCorte(nome, comCorte) {
  const camposCorte = comCorte
    ? sql`,
        max(bv.precisao_dt_bu_recebido) as precisao_dt_bu_recebido,
        max(bv.dt_bu_recebido_data) as dt_bu_recebido_data`
    : sql``;
  return sql`
    create materialized view ${sql.table(nome)} as
    with linhas as (
      select
        bv.eleicao_id,
        bv.cd_cargo_pergunta as cargo,
        bv.secao_id,
        rv.nr_votavel,
        rv.cd_tipo_votavel,
        rv.categoria,
        max(rv.nm_votavel) as nm_votavel,
        max(coalesce(rv.sg_partido, rv.nm_partido)) as sg_partido,
        max(s.sg_uf) as sg_uf,
        max(s.cd_municipio_tse) as cd_municipio_tse,
        max(l.nm_municipio) as nm_municipio,
        max(s.nr_zona) as nr_zona,
        max(s.nr_secao) as nr_secao,
        max(s.nr_local_votacao) as nr_local_votacao,
        max(bv.qt_aptos) as qt_aptos,
        max(bv.qt_comparecimento) as qt_comparecimento,
        max(bv.qt_abstencoes) as qt_abstencoes,
        max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
        max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts${camposCorte},
        sum(rv.qt_votos)::bigint as votos
      from boletim_versao bv
      join secao_eleitoral s on s.id = bv.secao_id
      join resultado_votavel rv on rv.boletim_versao_id = bv.id
      left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
      where bv.ativo = true
        and bv.cd_tipo_urna = 1
        and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
        and rv.qt_votos is not null
      group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    )
    select
      linhas.*,
      (sum(votos) filter (where categoria in ('nominal', 'legenda')) over secao)::bigint as validos,
      md5(string_agg(cd_tipo_votavel::text || ':' || nr_votavel::text || ':' || votos::text, '|')
        over (secao order by cd_tipo_votavel, nr_votavel rows between unbounded preceding and unbounded following)) as assinatura,
      count(*) over secao as votaveis
    from linhas
    window secao as (partition by eleicao_id, cargo, secao_id)
  `;
}

async function trocarViewCorte(db, comCorte) {
  await definicaoViewCorte('mv_secao_candidato_final_nova', comCorte).execute(db);
  await sql`create unique index mv_secao_candidato_final_nova_pk on mv_secao_candidato_final_nova (eleicao_id, cargo, secao_id, cd_tipo_votavel, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_nova_area_idx on mv_secao_candidato_final_nova (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  if (comCorte) {
    await sql`create index mv_secao_candidato_final_nova_recebimento_idx on mv_secao_candidato_final_nova (eleicao_id, cargo, dt_bu_recebido_ts)`.execute(db);
  }
  await sql`analyze mv_secao_candidato_final_nova`.execute(db);

  await sql`drop materialized view mv_secao_candidato_final`.execute(db);
  await sql`alter materialized view mv_secao_candidato_final_nova rename to mv_secao_candidato_final`.execute(db);
  await sql`alter index mv_secao_candidato_final_nova_pk rename to mv_secao_candidato_final_pk`.execute(db);
  await sql`alter index mv_secao_candidato_final_nova_area_idx rename to mv_secao_candidato_final_area_idx`.execute(db);
  if (comCorte) {
    await sql`alter index mv_secao_candidato_final_nova_recebimento_idx rename to mv_secao_candidato_final_recebimento_idx`.execute(db);
  }
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);
}

export async function up(db) {
  // 0001 — schema inicial
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

  // 0002 — colunas de resultado_votavel
  for (const [nome, tipo] of COLUNAS_RESULTADO) {
    await db.schema.alterTable('resultado_votavel').addColumn(nome, tipo).execute();
  }

  let atualizados = 1;
  while (atualizados > 0) {
    const resultado = await sql`
      with alvo as (
        select id from resultado_votavel where ano_eleicao is null limit ${LOTE_BACKFILL}
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

  for (const [nome] of COLUNAS_RESULTADO) {
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

  // 0003 — bweb_staging
  await sql`
    create unlogged table bweb_staging (
      lote_id uuid not null,
      chave text not null,
      nr_linha integer not null,
      valores jsonb not null
    )
  `.execute(db);

  await sql`
    create index bweb_staging_lote_chave_idx on bweb_staging (lote_id, chave)
  `.execute(db);

  // 0004 — índices de performance
  await db.schema
    .createIndex('boletim_versao_eleicao_cargo_recebimento_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'precisao_dt_bu_recebido', 'dt_bu_recebido_ts'])
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createIndex('boletim_versao_eleicao_cargo_data_idx')
    .on('boletim_versao')
    .columns(['eleicao_id', 'cd_cargo_pergunta', 'dt_bu_recebido_data'])
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createIndex('boletim_versao_secao_ativo_idx')
    .on('boletim_versao')
    .columns(['secao_id', 'eleicao_id', 'cd_cargo_pergunta'])
    .where(sql`ativo`)
    .execute();

  await db.schema
    .createIndex('resultado_votavel_boletim_categoria_idx')
    .on('resultado_votavel')
    .columns(['boletim_versao_id', 'categoria', 'nr_votavel'])
    .execute();

  await db.schema
    .createIndex('secao_eleitoral_localidade_full_idx')
    .on('secao_eleitoral')
    .columns(['sg_uf', 'cd_municipio_tse'])
    .execute();

  await sql`ANALYZE boletim_versao, resultado_votavel, secao_eleitoral`.execute(db);

  // 0005 — views materializadas iniciais
  await sql`
    create materialized view if not exists mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);

  await sql`
    create materialized view if not exists mv_metricas_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      coalesce(sum(bv.qt_aptos), 0)::bigint as qt_aptos,
      coalesce(sum(bv.qt_comparecimento), 0)::bigint as qt_comparecimento,
      coalesce(sum(bv.qt_abstencoes), 0)::bigint as qt_abstencoes,
      count(*)::int as bus_considerados
    from boletim_versao bv
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
    group by bv.eleicao_id, bv.cd_cargo_pergunta
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_metricas_final_pk on mv_metricas_final (eleicao_id, cargo)`.execute(db);

  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`refresh materialized view mv_metricas_final`.execute(db);

  await sql`ANALYZE mv_votos_final, mv_metricas_final`.execute(db);

  // 0006 — mv_votos_final com splits de horário
  await sql`drop materialized view if exists mv_votos_final cascade`.execute(db);

  await sql`
    create materialized view if not exists mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) <= (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_ate_1715,
      coalesce(sum(case when coalesce(bv.dt_encerramento, bv.dt_emissao_bu, bv.dt_bu_recebido_ts) > (e.dt_pleito::date + time '17:15:00' + interval '3 hours')::timestamptz then rv.qt_votos else 0 end), 0)::bigint as qt_votos_tardios
    from boletim_versao bv
    join eleicao e on e.id = bv.eleicao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);

  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`ANALYZE mv_votos_final`.execute(db);

  // 0007 — mv_totais_area
  await sql`drop materialized view if exists mv_totais_area cascade`.execute(db);

  await sql`
    create materialized view if not exists mv_totais_area as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      s.sg_uf,
      s.cd_municipio_tse,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      max(l.geom_id) as geom_id,
      max(l.nm_municipio) as nm_municipio,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, s.sg_uf, s.cd_municipio_tse, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);

  await sql`create unique index if not exists mv_totais_area_pk on mv_totais_area (eleicao_id, cargo, sg_uf, cd_municipio_tse, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_totais_area_eleicao_idx on mv_totais_area (eleicao_id, cargo, sg_uf)`.execute(db);

  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`ANALYZE mv_totais_area`.execute(db);

  // 0008 — mv_secao_candidato_final
  await sql`
    create materialized view mv_secao_candidato_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      bv.secao_id,
      rv.nr_votavel,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.sg_partido) as sg_partido,
      max(s.sg_uf) as sg_uf,
      max(s.cd_municipio_tse) as cd_municipio_tse,
      max(l.nm_municipio) as nm_municipio,
      max(s.nr_zona) as nr_zona,
      max(s.nr_secao) as nr_secao,
      max(bv.qt_aptos) as qt_aptos,
      max(bv.qt_comparecimento) as qt_comparecimento,
      max(bv.qt_abstencoes) as qt_abstencoes,
      max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
      max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts,
      sum(rv.qt_votos)::bigint as votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.categoria = 'nominal'
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.nr_votavel
    with no data
  `.execute(db);

  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);

  // 0009 — estatísticas de boletim_versao
  await sql`
    create statistics boletim_versao_filtro_stats (dependencies, ndistinct, mcv)
    on eleicao_id, cd_cargo_pergunta, ativo, cd_tipo_urna, (lower(ds_cargo_pergunta))
    from boletim_versao
  `.execute(db);
  await sql`analyze boletim_versao`.execute(db);

  // 0010 — mv_secao_candidato_final v2
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);
  await sql`
    create materialized view mv_secao_candidato_final as
    with linhas as (
      select
        bv.eleicao_id,
        bv.cd_cargo_pergunta as cargo,
        bv.secao_id,
        rv.nr_votavel,
        rv.cd_tipo_votavel,
        rv.categoria,
        max(rv.nm_votavel) as nm_votavel,
        max(rv.sg_partido) as sg_partido,
        max(s.sg_uf) as sg_uf,
        max(s.cd_municipio_tse) as cd_municipio_tse,
        max(l.nm_municipio) as nm_municipio,
        max(s.nr_zona) as nr_zona,
        max(s.nr_secao) as nr_secao,
        max(s.nr_local_votacao) as nr_local_votacao,
        max(bv.qt_aptos) as qt_aptos,
        max(bv.qt_comparecimento) as qt_comparecimento,
        max(bv.qt_abstencoes) as qt_abstencoes,
        max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
        max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts,
        sum(rv.qt_votos)::bigint as votos
      from boletim_versao bv
      join secao_eleitoral s on s.id = bv.secao_id
      join resultado_votavel rv on rv.boletim_versao_id = bv.id
      left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
      where bv.ativo = true
        and bv.cd_tipo_urna = 1
        and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
        and rv.qt_votos is not null
      group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    )
    select
      linhas.*,
      (sum(votos) filter (where categoria in ('nominal', 'legenda')) over secao)::bigint as validos,
      md5(string_agg(cd_tipo_votavel::text || ':' || nr_votavel::text || ':' || votos::text, '|')
        over (secao order by cd_tipo_votavel, nr_votavel rows between unbounded preceding and unbounded following)) as assinatura,
      count(*) over secao as votaveis
    from linhas
    window secao as (partition by eleicao_id, cargo, secao_id)
    with no data
  `.execute(db);

  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, cd_tipo_votavel, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);

  // 0011 — sigla com fallback nas views
  await recriarViews(db, SIGLA_COM_FALLBACK);

  // 0012 — sigla do exterior em 2014
  await preencherSiglaExterior(db);
  await atualizarViews(db);

  // 0013 — índice por lote
  await sql`
    create index boletim_versao_lote_eleicao_cargo_idx
    on boletim_versao (lote_id, eleicao_id, cd_cargo_pergunta, dt_bu_recebido_ts)
    where ativo and cd_tipo_urna = 1
  `.execute(db);
  await sql`analyze boletim_versao`.execute(db);

  // 0014 — mv_secao_candidato_final com corte
  await trocarViewCorte(db, true);

  // 0015 — tabelas da totalização
  await db.schema
    .createTable('totalizacao_lote')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('nome_arquivo', 'text', (coluna) => coluna.notNull())
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('ano_eleicao', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_turno', 'smallint', (coluna) => coluna.notNull())
    .addColumn('sha256', 'char(64)', (coluna) => coluna.notNull().unique())
    .addColumn('iniciado_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addColumn('concluido_em', 'timestamptz')
    .addColumn('status', 'text', (coluna) => coluna.notNull())
    .addCheckConstraint('totalizacao_lote_nr_turno_check', sql`nr_turno in (1, 2)`)
    .addCheckConstraint(
      'totalizacao_lote_status_check',
      sql`status in ('processando', 'concluido', 'falhou')`,
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_lote_uf_ano_turno_idx')
    .on('totalizacao_lote')
    .columns(['sg_uf', 'ano_eleicao', 'nr_turno'])
    .execute();

  await db.schema
    .createTable('totalizacao_secao')
    .addColumn('id', 'uuid', (coluna) => coluna.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('ano_eleicao', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_turno', 'smallint', (coluna) => coluna.notNull())
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_zona', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_secao', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_urna_efetivada', 'integer')
    .addColumn('nr_local_votacao', 'integer')
    .addColumn('qt_aptos', 'integer')
    .addColumn('qt_comparecimento', 'integer')
    .addColumn('qt_abstencoes', 'integer')
    .addColumn('dt_abertura', 'timestamptz')
    .addColumn('dt_encerramento', 'timestamptz')
    .addColumn('dt_emissao_bu', 'timestamptz')
    .addColumn('qt_habilitacao_1', 'integer')
    .addColumn('qt_habilitacao_2', 'integer')
    .addColumn('qt_habilitacao_3', 'integer')
    .addCheckConstraint('totalizacao_secao_nr_turno_check', sql`nr_turno in (1, 2)`)
    .addForeignKeyConstraint('totalizacao_secao_lote_fk', ['lote_id'], 'totalizacao_lote', ['id'])
    .addForeignKeyConstraint(
      'totalizacao_secao_localidade_fk',
      ['sg_uf', 'cd_municipio_tse'],
      'localidade',
      ['sg_uf', 'cd_municipio_tse'],
    )
    .addUniqueConstraint('totalizacao_secao_chave_unica', [
      'lote_id',
      'ano_eleicao',
      'nr_turno',
      'sg_uf',
      'cd_municipio_tse',
      'nr_zona',
      'nr_secao',
    ])
    .execute();

  await db.schema
    .createIndex('totalizacao_secao_lote_idx')
    .on('totalizacao_secao')
    .column('lote_id')
    .execute();

  await db.schema
    .createIndex('totalizacao_secao_localidade_idx')
    .on('totalizacao_secao')
    .columns(['sg_uf', 'cd_municipio_tse', 'nr_zona', 'nr_secao'])
    .execute();

  await db.schema
    .createTable('totalizacao_bu_voto')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('totalizacao_secao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_cargo_pergunta', 'integer', (coluna) => coluna.notNull())
    .addColumn('cd_tipo_votavel', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_votavel', 'integer')
    .addColumn('qt_votos', 'integer', (coluna) => coluna.notNull())
    .addForeignKeyConstraint(
      'totalizacao_bu_voto_secao_fk',
      ['totalizacao_secao_id'],
      'totalizacao_secao',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .addUniqueConstraint('totalizacao_bu_voto_chave_unica', [
      'totalizacao_secao_id',
      'cd_cargo_pergunta',
      'cd_tipo_votavel',
      'nr_votavel',
    ])
    .execute();

  await db.schema
    .createTable('totalizacao_rdv_voto')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('totalizacao_secao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('cd_cargo_pergunta', 'integer', (coluna) => coluna.notNull())
    .addColumn('cd_tipo_votavel', 'integer', (coluna) => coluna.notNull())
    .addColumn('nr_votavel', 'integer')
    .addColumn('qt_votos', 'integer', (coluna) => coluna.notNull())
    .addForeignKeyConstraint(
      'totalizacao_rdv_voto_secao_fk',
      ['totalizacao_secao_id'],
      'totalizacao_secao',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .addUniqueConstraint('totalizacao_rdv_voto_chave_unica', [
      'totalizacao_secao_id',
      'cd_cargo_pergunta',
      'cd_tipo_votavel',
      'nr_votavel',
    ])
    .execute();

  await db.schema
    .createTable('totalizacao_eleitor')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('totalizacao_secao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('habilitado_em', 'timestamptz')
    .addColumn('computado_em', 'timestamptz')
    .addColumn('duracao_ms', 'integer')
    .addColumn('qt_falhas_biometria', 'integer')
    .addColumn('tp_habilitacao', 'integer')
    .addColumn('qt_teclas_indevidas', 'integer')
    .addColumn('correcao', 'boolean')
    .addForeignKeyConstraint(
      'totalizacao_eleitor_secao_fk',
      ['totalizacao_secao_id'],
      'totalizacao_secao',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_eleitor_secao_idx')
    .on('totalizacao_eleitor')
    .columns(['totalizacao_secao_id', 'habilitado_em'])
    .execute();

  await db.schema
    .createTable('totalizacao_incidente')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('totalizacao_secao_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('dt_incidente', 'timestamptz', (coluna) => coluna.notNull())
    .addColumn('nivel', 'text', (coluna) => coluna.notNull())
    .addColumn('tipo', 'text', (coluna) => coluna.notNull())
    .addColumn('texto_original', 'text', (coluna) => coluna.notNull())
    .addForeignKeyConstraint(
      'totalizacao_incidente_secao_fk',
      ['totalizacao_secao_id'],
      'totalizacao_secao',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_incidente_secao_idx')
    .on('totalizacao_incidente')
    .columns(['totalizacao_secao_id', 'dt_incidente'])
    .execute();

  // 0016 — divergências
  await db.schema
    .createTable('totalizacao_divergencia')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('fonte', 'text', (coluna) => coluna.notNull())
    .addColumn('campo', 'text', (coluna) => coluna.notNull())
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer')
    .addColumn('nr_zona', 'integer')
    .addColumn('nr_secao', 'integer')
    .addColumn('cd_cargo_pergunta', 'integer')
    .addColumn('nr_votavel', 'integer')
    .addColumn('valor_esperado', 'text', (coluna) => coluna.notNull())
    .addColumn('valor_encontrado', 'text', (coluna) => coluna.notNull())
    .addColumn('registrado_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addCheckConstraint(
      'totalizacao_divergencia_fonte_check',
      sql`fonte in ('rdv', 'log', 'bweb')`,
    )
    .addForeignKeyConstraint(
      'totalizacao_divergencia_lote_fk',
      ['lote_id'],
      'totalizacao_lote',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await sql`
    CREATE UNIQUE INDEX totalizacao_divergencia_chave_unica
    ON totalizacao_divergencia (
      lote_id,
      fonte,
      campo,
      sg_uf,
      coalesce(cd_municipio_tse, -1),
      coalesce(nr_zona, -1),
      coalesce(nr_secao, -1),
      coalesce(cd_cargo_pergunta, -1),
      coalesce(nr_votavel, -1)
    )
  `.execute(db);

  await db.schema
    .createIndex('totalizacao_divergencia_lote_fonte_idx')
    .on('totalizacao_divergencia')
    .columns(['lote_id', 'fonte'])
    .execute();

  // 0017 — resiliência
  await db.schema
    .createTable('totalizacao_secao_erro')
    .addColumn('id', 'bigint', (coluna) => coluna.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('lote_id', 'uuid', (coluna) => coluna.notNull())
    .addColumn('prefixo', 'text', (coluna) => coluna.notNull())
    .addColumn('sg_uf', 'varchar(2)', (coluna) => coluna.notNull())
    .addColumn('cd_municipio_tse', 'integer')
    .addColumn('nr_zona', 'integer')
    .addColumn('nr_secao', 'integer')
    .addColumn('codigo', 'text', (coluna) => coluna.notNull())
    .addColumn('mensagem', 'text', (coluna) => coluna.notNull())
    .addColumn('registrado_em', 'timestamptz', (coluna) => coluna.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('totalizacao_secao_erro_chave_unica', ['lote_id', 'prefixo'])
    .addForeignKeyConstraint(
      'totalizacao_secao_erro_lote_fk',
      ['lote_id'],
      'totalizacao_lote',
      ['id'],
      (fk) => fk.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_secao_erro_lote_idx')
    .on('totalizacao_secao_erro')
    .column('lote_id')
    .execute();

  await db.schema
    .alterTable('totalizacao_lote')
    .dropConstraint('totalizacao_lote_status_check')
    .execute();
  await db.schema
    .alterTable('totalizacao_lote')
    .addCheckConstraint(
      'totalizacao_lote_status_check',
      sql`status in ('processando', 'concluido', 'parcial', 'falhou', 'substituido')`,
    )
    .execute();

  await db.schema.alterTable('totalizacao_lote').addColumn('substituido_por', 'uuid').execute();
  await db.schema
    .alterTable('totalizacao_lote')
    .addForeignKeyConstraint(
      'totalizacao_lote_substituido_por_fk',
      ['substituido_por'],
      'totalizacao_lote',
      ['id'],
    )
    .execute();

  await db.schema
    .createIndex('totalizacao_lote_uf_ano_turno_status_idx')
    .on('totalizacao_lote')
    .columns(['sg_uf', 'ano_eleicao', 'nr_turno', 'status'])
    .execute();

  await db.schema.alterTable('totalizacao_secao').addColumn('prefixo', 'text').execute();
}

export async function down(db) {
  // 0017
  await db.schema.alterTable('totalizacao_secao').dropColumn('prefixo').execute();
  await db.schema.dropIndex('totalizacao_lote_uf_ano_turno_status_idx').execute();
  await db.schema
    .alterTable('totalizacao_lote')
    .dropConstraint('totalizacao_lote_substituido_por_fk')
    .execute();
  await db.schema.alterTable('totalizacao_lote').dropColumn('substituido_por').execute();
  await sql`
    update totalizacao_lote
    set status = case when status = 'substituido' then 'concluido' else 'falhou' end
    where status in ('parcial', 'substituido')
  `.execute(db);
  await db.schema
    .alterTable('totalizacao_lote')
    .dropConstraint('totalizacao_lote_status_check')
    .execute();
  await db.schema
    .alterTable('totalizacao_lote')
    .addCheckConstraint(
      'totalizacao_lote_status_check',
      sql`status in ('processando', 'concluido', 'falhou')`,
    )
    .execute();
  await db.schema.dropTable('totalizacao_secao_erro').execute();

  // 0016
  await db.schema.dropTable('totalizacao_divergencia').execute();

  // 0015
  await db.schema.dropTable('totalizacao_incidente').execute();
  await db.schema.dropTable('totalizacao_eleitor').execute();
  await db.schema.dropTable('totalizacao_rdv_voto').execute();
  await db.schema.dropTable('totalizacao_bu_voto').execute();
  await db.schema.dropTable('totalizacao_secao').execute();
  await db.schema.dropTable('totalizacao_lote').execute();

  // 0014
  await trocarViewCorte(db, false);

  // 0013
  await sql`drop index if exists boletim_versao_lote_eleicao_cargo_idx`.execute(db);

  // 0012
  await sql`
    update resultado_votavel
    set sg_partido = null
    where ano_eleicao = 2014
      and sg_uf = 'ZZ'
      and nm_partido is null
      and nr_partido is not null
      and sg_partido is not null
  `.execute(db);
  await atualizarViews(db);

  // 0011
  await recriarViews(db, SIGLA_ORIGINAL);

  // 0010
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);
  await sql`
    create materialized view mv_secao_candidato_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      bv.secao_id,
      rv.nr_votavel,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.sg_partido) as sg_partido,
      max(s.sg_uf) as sg_uf,
      max(s.cd_municipio_tse) as cd_municipio_tse,
      max(l.nm_municipio) as nm_municipio,
      max(s.nr_zona) as nr_zona,
      max(s.nr_secao) as nr_secao,
      max(bv.qt_aptos) as qt_aptos,
      max(bv.qt_comparecimento) as qt_comparecimento,
      max(bv.qt_abstencoes) as qt_abstencoes,
      max(bv.qt_elei_biom_sem_habilitacao) as qt_biom,
      max(bv.dt_bu_recebido_ts) as dt_bu_recebido_ts,
      sum(rv.qt_votos)::bigint as votos
    from boletim_versao bv
    join secao_eleitoral s on s.id = bv.secao_id
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join localidade l on l.sg_uf = s.sg_uf and l.cd_municipio_tse = s.cd_municipio_tse
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.categoria = 'nominal'
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, bv.secao_id, rv.nr_votavel
    with no data
  `.execute(db);
  await sql`create unique index mv_secao_candidato_final_pk on mv_secao_candidato_final (eleicao_id, cargo, secao_id, nr_votavel)`.execute(db);
  await sql`create index mv_secao_candidato_final_area_idx on mv_secao_candidato_final (eleicao_id, cargo, sg_uf, cd_municipio_tse)`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
  await sql`analyze mv_secao_candidato_final`.execute(db);
  await sql`grant select on mv_secao_candidato_final to doomsday_app`.execute(db);

  // 0009
  await sql`drop statistics if exists boletim_versao_filtro_stats`.execute(db);

  // 0008
  await sql`drop materialized view if exists mv_secao_candidato_final`.execute(db);

  // 0007
  await sql`drop materialized view if exists mv_totais_area cascade`.execute(db);

  // 0006
  await sql`drop materialized view if exists mv_votos_final cascade`.execute(db);
  await sql`
    create materialized view if not exists mv_votos_final as
    select
      bv.eleicao_id,
      bv.cd_cargo_pergunta as cargo,
      rv.cd_tipo_votavel,
      rv.nr_votavel,
      rv.categoria,
      max(rv.nm_votavel) as nm_votavel,
      max(rv.nr_partido) as nr_partido,
      max(rv.sg_partido) as sg_partido,
      max(rv.nm_partido) as nm_partido,
      max(pc.cor_hex) as cor_hex,
      sum(rv.qt_votos)::bigint as qt_votos
    from boletim_versao bv
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
    where bv.ativo = true
      and bv.cd_tipo_urna = 1
      and lower(bv.ds_cargo_pergunta) in ('presidente', 'governador')
      and rv.qt_votos is not null
    group by bv.eleicao_id, bv.cd_cargo_pergunta, rv.cd_tipo_votavel, rv.nr_votavel, rv.categoria
    with no data
  `.execute(db);
  await sql`create unique index if not exists mv_votos_final_pk on mv_votos_final (eleicao_id, cargo, cd_tipo_votavel, nr_votavel, categoria)`.execute(db);
  await sql`create index if not exists mv_votos_final_eleicao_idx on mv_votos_final (eleicao_id, cargo)`.execute(db);
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`ANALYZE mv_votos_final`.execute(db);

  // 0005
  await sql`drop materialized view if exists mv_metricas_final cascade`.execute(db);
  await sql`drop materialized view if exists mv_votos_final cascade`.execute(db);

  // 0004
  await db.schema.dropIndex('secao_eleitoral_localidade_full_idx').execute();
  await db.schema.dropIndex('resultado_votavel_boletim_categoria_idx').execute();
  await db.schema.dropIndex('boletim_versao_secao_ativo_idx').execute();
  await db.schema.dropIndex('boletim_versao_eleicao_cargo_data_idx').execute();
  await db.schema.dropIndex('boletim_versao_eleicao_cargo_recebimento_idx').execute();

  // 0003
  await sql`drop table if exists bweb_staging`.execute(db);

  // 0002
  await db.schema.dropIndex('resultado_votavel_uf_cargo_idx').ifExists().execute();
  await db.schema.dropIndex('resultado_votavel_eleicao_idx').ifExists().execute();
  await db.schema.alterTable('resultado_votavel').addColumn('bruto', 'jsonb').execute();
  for (const [nome] of COLUNAS_RESULTADO) {
    await db.schema.alterTable('resultado_votavel').dropColumn(nome).execute();
  }

  // 0001
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
