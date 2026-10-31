import { sql } from 'kysely';
import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { corteResposta, resolverCorte } from '../modules/apuracao/corte.js';
import { horariosDoBu } from '../modules/apuracao/status-secao.js';
import { validarConsistenciaBu } from '../modules/analise/consistencia.js';
import { compararVersoes } from '../modules/analise/versoes-bu.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista, ordenarSql } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao, corteSchema, escopoDaEleicao, metadadosEAvisos, tamanhoPagina } from './comum.js';

const COLUNAS_RESULTADOS = {
  cd_tipo_votavel: (r) => r.cd_tipo_votavel,
  nr_votavel: (r) => r.nr_votavel,
  nm_votavel: (r) => r.nm_votavel,
  sg_partido: (r) => r.sg_partido,
  categoria: (r) => r.categoria,
  qt_votos: (r) => (r.qt_votos === null || r.qt_votos === undefined ? null : Number(r.qt_votos)),
  percentual: (r) =>
    (r.categoria === 'nominal' || r.categoria === 'legenda') && r.qt_votos !== null && r.qt_votos !== undefined
      ? Number(r.qt_votos)
      : null,
};

const COLUNAS_CAMPOS_ALTERADOS = {
  campo: (c) => c.campo,
  anterior: (c) => c.anterior,
  atual: (c) => c.atual,
  diferenca: (c) => c.diferenca,
};

const COLUNAS_VOTAVEIS_ALTERADOS = {
  nr_votavel: (v) => v.nr_votavel,
  nm_votavel: (v) => v.nm_votavel,
  anterior: (v) => v.anterior,
  atual: (v) => v.atual,
  diferenca: (v) => v.diferenca,
};

const COLUNAS_SECOES = {
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

function itemSecao(linha) {
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

function statusSql(corte) {
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

export function registrarSecoes({ app, db, cache, cacheado }) {
  app.get('/api/sections', cacheado('sections', 60, baseSchema.extend({
    zona: z.coerce.number().int().optional(),
    secao: z.coerce.number().int().optional(),
    municipio_nome: z.string().optional(),
    busca: z.string().optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).optional(),
    ...ordenacaoSchema(Object.keys(COLUNAS_SECOES)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);
    const pageSize = tamanhoPagina(app, query);

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
          .on('bv.cd_cargo_pergunta', '=', query.cargo)
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

    const ordenacao = lerOrdenacao(query);
    consulta = ordenacao
      ? ordenarSql(consulta, { ...COLUNAS_SECOES, status: statusSql(corte) }, ordenacao, ['s.sg_uf', 's.cd_municipio_tse', 's.nr_zona', 's.nr_secao', 's.id'])
      : consulta.orderBy('s.sg_uf').orderBy('s.cd_municipio_tse').orderBy('s.nr_zona').orderBy('s.nr_secao');

    if (query.uf) consulta = consulta.where('s.sg_uf', '=', query.uf);
    if (query.municipio) consulta = consulta.where('s.cd_municipio_tse', '=', query.municipio);
    if (query.zona) consulta = consulta.where('s.nr_zona', '=', query.zona);
    if (query.secao) consulta = consulta.where('s.nr_secao', '=', query.secao);
    if (query.municipio_nome) {
      consulta = consulta.where(sql`l.nm_municipio ilike ${`%${query.municipio_nome.trim()}%`}`);
    }
    if (query.busca) {
      const termo = query.busca.trim();
      consulta = consulta.where(sql`(
        l.nm_municipio ilike ${`%${termo}%`}
        or cast(s.nr_zona as text) = ${termo}
        or cast(s.nr_secao as text) = ${termo}
      )`);
    }

    if (query.status) consulta = consulta.where(sql`${statusSql(corte)} = ${query.status}`);
    const consultaTotal = consulta.clearSelect().clearOrderBy().select(sql`count(*)::bigint`.as('total_count'));
    consulta = consulta.limit(pageSize).offset((query.page - 1) * pageSize);

    const linhas = await consulta.execute();
    const total = Number(
      linhas[0]?.total_count ?? (await consultaTotal.executeTakeFirstOrThrow()).total_count,
    );
    const itens = linhas.map(itemSecao);

    const [metadados, avisos] = await metadadosEAvisos(cache, db, query, escopoDaEleicao(query, eleicao, corte), corte);

    return {
      corte: corteResposta(corte),
      ...metadados,
      avisos,
      page: query.page,
      page_size: pageSize,
      total,
      items: itens,
    };
  }));

  app.get('/api/sections/:id', cacheado('section', 300, z.object({
    id: z.string().uuid(),
    election_id: z.string().uuid(),
    cargo: z.coerce.number().int(),
    ...corteSchema,
    ...ordenacaoSchema(Object.keys(COLUNAS_RESULTADOS)),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secao = await db
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
      .where('s.id', '=', query.id)
      .executeTakeFirst();

    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const boletim = await db
      .selectFrom('boletim_versao')
      .selectAll()
      .where('secao_id', '=', query.id)
      .where('eleicao_id', '=', eleicao.id)
      .where('cd_cargo_pergunta', '=', query.cargo)
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
            .where('secao_id', '=', query.id)
            .where('eleicao_id', '=', eleicao.id)
            .where('cd_cargo_pergunta', '=', query.cargo)
            .where('versao', '<', boletim.versao)
            .executeTakeFirstOrThrow(),
        ])
      : [[], null, { total: 0 }];

    const consistencia = boletim
      ? validarConsistenciaBu(
          {
            qt_aptos: boletim.qt_aptos,
            qt_comparecimento: boletim.qt_comparecimento,
            qt_abstencoes: boletim.qt_abstencoes,
            qt_elei_biom_sem_habilitacao: boletim.qt_elei_biom_sem_habilitacao,
          },
          resultados,
        )
      : [];

    return {
      secao,
      status: { ...statusBu, horarios: horariosDoBu(boletim ?? null) },
      boletim,
      resultados: ordenarLista(resultados, COLUNAS_RESULTADOS, lerOrdenacao(query)),
      lote,
      versoes_anteriores: Number(anteriores.total),
      consistencia,
    };
  }));

  app.get('/api/sections/:id/versions', cacheado('section-versions', 300, z.object({
    id: z.string().uuid(),
    election_id: z.string().uuid(),
    cargo: z.coerce.number().int(),
    comparar_com: z.coerce.number().int().optional(),
    ...corteSchema,
    ...ordenacaoSchema(Object.keys(COLUNAS_CAMPOS_ALTERADOS), '_campos'),
    ...ordenacaoSchema(Object.keys(COLUNAS_VOTAVEIS_ALTERADOS), '_votaveis'),
  }), async (query) => {
    const corte = resolverCorte(query);
    const eleicao = await buscarEleicao(db, query.election_id);

    const secao = await db
      .selectFrom('secao_eleitoral as s')
      .innerJoin('localidade as l', (join) =>
        join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
      )
      .select(['s.id','s.sg_uf','s.cd_municipio_tse','s.nr_zona','s.nr_secao','s.nr_local_votacao','l.nm_municipio'])
      .where('s.id', '=', query.id)
      .executeTakeFirst();
    if (!secao) throw new AppError('NOT_FOUND', 404, 'Seção não encontrada');

    const versoesRows = await db
      .selectFrom('boletim_versao')
      .selectAll()
      .where('secao_id', '=', query.id)
      .where('eleicao_id', '=', eleicao.id)
      .where('cd_cargo_pergunta', '=', query.cargo)
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

    const versoes =versoesRows.map((bv) => ({
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

    const atual = versoes.find((v) => v.ativo) ?? versoes[versoes.length - 1] ?? null;
    let anterior = null;
    if (atual) {
      if (query.comparar_com !== undefined) {
        anterior = versoes.find((v) => v.versao === query.comparar_com) ?? null;
      } else {
        const candidatos = versoes.filter((v) => v.versao < atual.versao);
        anterior = candidatos.sort((x, y) => y.versao - x.versao)[0] ?? null;
      }
    }
    const diferencas = anterior && atual ? compararVersoes(anterior, atual) : null;
    const comparacao = diferencas
      ? {
          anterior: anterior.versao,
          atual: atual.versao,
          ...diferencas,
          campos_alterados: ordenarLista(diferencas.campos_alterados, COLUNAS_CAMPOS_ALTERADOS, lerOrdenacao(query, '_campos')),
          votaveis_alterados: ordenarLista(diferencas.votaveis_alterados, COLUNAS_VOTAVEIS_ALTERADOS, lerOrdenacao(query, '_votaveis')),
        }
      : null;

    return {
      corte: corteResposta(corte),
      secao,
      versoes,
      comparacao,
    };
  }));
}
