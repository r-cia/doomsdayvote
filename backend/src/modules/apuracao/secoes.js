import { sql } from 'kysely';
import { ordenarSql } from '../../lib/ordenacao.js';
import { horariosDoBu } from './status-secao.js';

export const COLUNAS_SECOES = {
  sg_uf: sql.ref('s.sg_uf'),
  nm_municipio: sql.ref('l.nm_municipio'),
  nr_zona: sql.ref('s.nr_zona'),
  nr_secao: sql.ref('s.nr_secao'),
  nr_local_votacao: sql.ref('s.nr_local_votacao'),
  status: null,
  bu_recebido: sql`coalesce(bv.dt_bu_recebido_ts, bv.dt_bu_recebido_data::timestamptz)`,
};

function buDaSecao(linha) {
  if (!linha.bu_id) return null;
  return {
    cd_tipo_urna: linha.cd_tipo_urna,
    ds_tipo_urna: linha.ds_tipo_urna,
    precisao_dt_bu_recebido: linha.precisao_dt_bu_recebido,
    dt_abertura: linha.dt_abertura,
    dt_encerramento: linha.dt_encerramento,
    dt_emissao_bu: linha.dt_emissao_bu,
    dt_bu_recebido_ts: linha.dt_bu_recebido_ts,
    dt_bu_recebido_data: linha.dt_bu_recebido_data,
  };
}

export function itemSecao(linha) {
  return {
    id: linha.id,
    sg_uf: linha.sg_uf,
    cd_municipio_tse: linha.cd_municipio_tse,
    nm_municipio: linha.nm_municipio,
    nr_zona: linha.nr_zona,
    nr_secao: linha.nr_secao,
    nr_local_votacao: linha.nr_local_votacao,
    status: linha.status,
    motivo: linha.motivo,
    ...horariosDoBu(buDaSecao(linha)),
  };
}

export function statusSql(corte) {
  let porCorte = sql`'bu_recebido'`;
  if (corte.tipo === 'recebimento_intradiario') {
    porCorte = sql`case
      when coalesce(bv.precisao_dt_bu_recebido, 'AUSENTE') = 'DATA_HORA' then
        case
          when bv.dt_bu_recebido_ts <= ${corte.instante} then 'bu_recebido'
          when bv.dt_encerramento <= ${corte.instante} or bv.dt_emissao_bu <= ${corte.instante} then 'encerrada_aguardando_bu'
          else 'sem_bu'
        end
      else 'desconhecido'
    end`;
  } else if (corte.tipo === 'recebimento_diario') {
    porCorte = sql`case
      when (bv.precisao_dt_bu_recebido = 'DATA_HORA' and (bv.dt_bu_recebido_ts at time zone 'America/Sao_Paulo')::date <= ${corte.data})
        or (bv.precisao_dt_bu_recebido = 'DATA' and bv.dt_bu_recebido_data <= ${corte.data}) then 'bu_recebido'
      when (bv.dt_encerramento at time zone 'America/Sao_Paulo')::date <= ${corte.data}
        or (bv.dt_emissao_bu at time zone 'America/Sao_Paulo')::date <= ${corte.data} then 'encerrada_aguardando_bu'
      when coalesce(bv.precisao_dt_bu_recebido, 'AUSENTE') = 'AUSENTE' then 'desconhecido'
      else 'sem_bu'
    end`;
  }

  return sql`case
    when bv.id is null then 'sem_bu'
    when bv.cd_tipo_urna = 2 then 'nao_apurada'
    when bv.cd_tipo_urna = 3 then 'anulada_apurada_separado'
    when bv.cd_tipo_urna = 4 then 'anulada'
    when bv.cd_tipo_urna = 5 then 'nao_instalada'
    when bv.cd_tipo_urna is null or bv.cd_tipo_urna not between 1 and 5 then 'desconhecido'
    else ${porCorte}
  end`;
}

function motivoSql(corte) {
  return sql`case
    when ${statusSql(corte)} = 'desconhecido' then
      case
        when bv.cd_tipo_urna is null or bv.cd_tipo_urna not between 1 and 5 then 'TIPO_URNA_AUSENTE'
        else 'PRECISAO_INSUFICIENTE'
      end
  end`;
}

export async function listarSecoes(db, { eleicao, cargo, corte, filtros, ordenacao, pagina, tamanhoPagina }) {
  let consulta = db
    .selectFrom('secao_eleitoral as s')
    .innerJoin('localidade as l', (join) =>
      join
        .onRef('l.sg_uf', '=', 's.sg_uf')
        .onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .leftJoin('boletim_versao as bv', (join) =>
      join
        .onRef('bv.secao_id', '=', 's.id')
        .on('bv.eleicao_id', '=', eleicao.id)
        .on('bv.cd_cargo_pergunta', '=', cargo)
        .on('bv.ativo', '=', true),
    )
    .select([
      's.id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'l.nm_municipio',
      sql`bv.id`.as('bu_id'),
      'bv.cd_tipo_urna',
      'bv.ds_tipo_urna',
      'bv.precisao_dt_bu_recebido',
      'bv.dt_abertura',
      'bv.dt_encerramento',
      'bv.dt_emissao_bu',
      'bv.dt_bu_recebido_ts',
      'bv.dt_bu_recebido_data',
      statusSql(corte).as('status'),
      motivoSql(corte).as('motivo'),
      sql`count(*) over()`.as('total_count'),
    ])
    .where('s.ano_eleicao', '=', eleicao.ano_eleicao)
    .where('s.cd_pleito', '=', eleicao.cd_pleito)
    .where('s.nr_turno', '=', eleicao.nr_turno);

  consulta = ordenacao
    ? ordenarSql(consulta, { ...COLUNAS_SECOES, status: statusSql(corte) }, ordenacao, ['s.sg_uf', 's.cd_municipio_tse', 's.nr_zona', 's.nr_secao', 's.id'])
    : consulta.orderBy('s.sg_uf').orderBy('s.cd_municipio_tse').orderBy('s.nr_zona').orderBy('s.nr_secao');

  if (filtros.uf) consulta = consulta.where('s.sg_uf', '=', filtros.uf);
  if (filtros.municipio) consulta = consulta.where('s.cd_municipio_tse', '=', filtros.municipio);
  if (filtros.zona) consulta = consulta.where('s.nr_zona', '=', filtros.zona);
  if (filtros.secao) consulta = consulta.where('s.nr_secao', '=', filtros.secao);
  if (filtros.municipio_nome) {
    consulta = consulta.where(sql`l.nm_municipio ilike ${`%${filtros.municipio_nome.trim()}%`}`);
  }
  if (filtros.busca) {
    const termo = filtros.busca.trim();
    consulta = consulta.where(sql`(
        l.nm_municipio ilike ${`%${termo}%`}
        or cast(s.nr_zona as text) = ${termo}
        or cast(s.nr_secao as text) = ${termo}
      )`);
  }

  if (filtros.status) consulta = consulta.where(sql`${statusSql(corte)} = ${filtros.status}`);
  const consultaTotal = consulta.clearSelect().clearOrderBy().select(sql`count(*)::bigint`.as('total_count'));
  consulta = consulta.limit(tamanhoPagina).offset((pagina - 1) * tamanhoPagina);

  const linhas = await consulta.execute();
  const total = Number(
    linhas[0]?.total_count ?? (await consultaTotal.executeTakeFirstOrThrow()).total_count,
  );
  return { itens: linhas.map(itemSecao), total };
}

export function buscarSecao(db, secaoId) {
  return db
    .selectFrom('secao_eleitoral as s')
    .innerJoin('localidade as l', (join) =>
      join
        .onRef('l.sg_uf', '=', 's.sg_uf')
        .onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .select([
      's.id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'l.nm_municipio',
    ])
    .where('s.id', '=', secaoId)
    .executeTakeFirst();
}

export async function detalheDoBoletim(db, { eleicaoId, secaoId, cargo, corte }) {
  const boletim = await db
    .selectFrom('boletim_versao')
    .selectAll()
    .where('secao_id', '=', secaoId)
    .where('eleicao_id', '=', eleicaoId)
    .where('cd_cargo_pergunta', '=', cargo)
    .where('ativo', '=', true)
    .executeTakeFirst();

  const statusBu = boletim
    ? await db
        .selectFrom('boletim_versao as bv')
        .select([statusSql(corte).as('status'), motivoSql(corte).as('motivo')])
        .where('bv.id', '=', boletim.id)
        .executeTakeFirstOrThrow()
    : { status: 'sem_bu', motivo: null };

  const [resultados, lote, anteriores] = boletim
    ? await Promise.all([
        db
          .selectFrom('resultado_votavel')
          .selectAll()
          .where('boletim_versao_id', '=', boletim.id)
          .orderBy('qt_votos', 'desc')
          .execute(),
        db
          .selectFrom('lote_importacao')
          .select(['id', 'nome_arquivo', 'sha256'])
          .where('id', '=', boletim.lote_id)
          .executeTakeFirst(),
        db
          .selectFrom('boletim_versao')
          .select(({ fn }) => fn.countAll().as('total'))
          .where('secao_id', '=', secaoId)
          .where('eleicao_id', '=', eleicaoId)
          .where('cd_cargo_pergunta', '=', cargo)
          .where('versao', '<', boletim.versao)
          .executeTakeFirstOrThrow(),
      ])
    : [[], null, { total: 0 }];

  return { boletim, statusBu, resultados, lote, anteriores };
}

export async function versoesDaSecao(db, { eleicaoId, secaoId, cargo }) {
  const versoesRows = await db
    .selectFrom('boletim_versao')
    .selectAll()
    .where('secao_id', '=', secaoId)
    .where('eleicao_id', '=', eleicaoId)
    .where('cd_cargo_pergunta', '=', cargo)
    .orderBy('versao', 'asc')
    .execute();

  const ids = versoesRows.map((v) => v.id);
  const resultados = ids.length
    ? await db.selectFrom('resultado_votavel').selectAll().where('boletim_versao_id', 'in', ids).execute()
    : [];
  const porBu = new Map();
  for (const r of resultados) {
    if (!porBu.has(r.boletim_versao_id)) porBu.set(r.boletim_versao_id, []);
    porBu.get(r.boletim_versao_id).push(r);
  }
  const loteIds = [...new Set(versoesRows.map((v) => v.lote_id))];
  const lotes = loteIds.length
    ? await db.selectFrom('lote_importacao').select(['id','nome_arquivo','sha256']).where('id', 'in', loteIds).execute()
    : [];
  const loteMap = new Map(lotes.map((l) => [l.id, l]));

  return versoesRows.map((bv) => ({
    id: bv.id,
    versao: bv.versao,
    ativo: bv.ativo,
    substitui_versao_id: bv.substitui_versao_id,
    dt_geracao: bv.dt_geracao,
    dt_abertura: bv.dt_abertura,
    dt_encerramento: bv.dt_encerramento,
    dt_emissao_bu: bv.dt_emissao_bu,
    dt_bu_recebido_ts: bv.dt_bu_recebido_ts,
    dt_bu_recebido_data: bv.dt_bu_recebido_data,
    precisao_dt_bu_recebido: bv.precisao_dt_bu_recebido,
    qt_aptos: bv.qt_aptos,
    qt_comparecimento: bv.qt_comparecimento,
    qt_abstencoes: bv.qt_abstencoes,
    qt_elei_biom_sem_habilitacao: bv.qt_elei_biom_sem_habilitacao,
    cd_tipo_urna: bv.cd_tipo_urna,
    ds_tipo_urna: bv.ds_tipo_urna,
    lote: loteMap.get(bv.lote_id) ?? null,
    conteudo_sha256: bv.conteudo_sha256,
    imported_at: bv.imported_at,
    resultados: (porBu.get(bv.id) ?? []).sort((x, y) => Number(y.qt_votos ?? 0) - Number(x.qt_votos ?? 0)),
  }));
}
