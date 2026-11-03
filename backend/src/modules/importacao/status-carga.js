import { sql } from 'kysely';

const UFS = Object.freeze([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]);

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DURACAO_MS = sql`
  case
    when concluido_em is null then null
    else (extract(epoch from (concluido_em - iniciado_em)) * 1000)::int
  end
`;

export async function coletarStatus(db, { lote } = {}) {
  if (lote) return detalharLote(db, lote);

  const ultima = await sql`
    select distinct on (ano_eleicao, nr_turno, sg_uf)
      id as lote_id,
      nome_arquivo as arquivo,
      ano_eleicao,
      nr_turno,
      sg_uf,
      status,
      substituido_por,
      iniciado_em,
      concluido_em,
      ${DURACAO_MS} as duracao_ms
    from totalizacao_lote
    order by ano_eleicao, nr_turno, sg_uf, iniciado_em desc
  `.execute(db);

  const falhasTotalizacao = await sql`
    select
      id as lote_id,
      nome_arquivo as arquivo,
      ano_eleicao,
      nr_turno,
      sg_uf,
      status,
      substituido_por,
      iniciado_em,
      concluido_em,
      ${DURACAO_MS} as duracao_ms,
      null::text as erro_codigo,
      null::text as erro_mensagem
    from totalizacao_lote
    where status in ('falhou', 'parcial')
    order by iniciado_em desc
    limit 50
  `.execute(db);

  const falhasBweb = await sql`
    select
      id as lote_id,
      nome_arquivo as arquivo,
      null::integer as ano_eleicao,
      null::smallint as nr_turno,
      null::varchar(2) as sg_uf,
      status,
      null::uuid as substituido_por,
      started_at as iniciado_em,
      imported_at as concluido_em,
      duracao_ms,
      erro_codigo,
      erro_mensagem
    from lote_importacao
    where status = 'falhou'
    order by started_at desc nulls last
    limit 50
  `.execute(db);

  const secoesComErro = await sql`
    select
      e.lote_id,
      l.nome_arquivo as arquivo,
      l.ano_eleicao,
      l.nr_turno,
      l.sg_uf,
      e.prefixo,
      e.codigo,
      e.mensagem,
      e.registrado_em
    from totalizacao_secao_erro e
    join totalizacao_lote l on l.id = e.lote_id
    where l.status <> 'substituido'
    order by l.iniciado_em desc, e.prefixo
    limit 100
  `.execute(db);

  const substituidos = await sql`
    select
      id as lote_id,
      nome_arquivo as arquivo,
      ano_eleicao,
      nr_turno,
      sg_uf,
      status,
      substituido_por,
      iniciado_em,
      concluido_em,
      ${DURACAO_MS} as duracao_ms
    from totalizacao_lote
    where status = 'substituido'
    order by iniciado_em desc
    limit 50
  `.execute(db);

  const escopos = await sql`
    select ano_eleicao, nr_turno, array_agg(distinct sg_uf order by sg_uf) as ufs
    from totalizacao_lote
    group by ano_eleicao, nr_turno
    order by ano_eleicao, nr_turno
  `.execute(db);

  const lotesTotalizacao = falhasTotalizacao.rows.map((linha) => ({
    origem: 'totalizacao',
    ...mapearLote(linha),
  }));

  return {
    ultima_por_uf: ultima.rows.map(mapearLote),
    lotes_parciais: lotesTotalizacao.filter((lote) => lote.status === 'parcial'),
    lotes_com_falha: [
      ...lotesTotalizacao.filter((lote) => lote.status === 'falhou'),
      ...falhasBweb.rows.map((linha) => ({ origem: 'bweb', ...mapearLote(linha) })),
    ],
    secoes_com_erro: secoesComErro.rows.map((linha) => ({
      lote_id: linha.lote_id,
      arquivo: linha.arquivo,
      ano: linha.ano_eleicao,
      turno: linha.nr_turno,
      uf: linha.sg_uf,
      prefixo: linha.prefixo,
      codigo: linha.codigo,
      mensagem: linha.mensagem,
      registrado_em: instante(linha.registrado_em),
    })),
    lotes_substituidos: substituidos.rows.map(mapearLote),
    ufs_sem_arquivo: ufsSemArquivo(escopos.rows),
  };
}

async function detalharLote(db, loteId) {
  if (!ID_UUID.test(loteId)) return null;

  const totalizacao = await sql`
    select
      id as lote_id,
      nome_arquivo as arquivo,
      ano_eleicao,
      nr_turno,
      sg_uf,
      status,
      substituido_por,
      iniciado_em,
      concluido_em,
      ${DURACAO_MS} as duracao_ms
    from totalizacao_lote
    where id = ${loteId}
  `.execute(db);

  if (totalizacao.rows[0]) {
    const contagens = await sql`
      select
        (select count(*)::int from totalizacao_secao where lote_id = ${loteId}) as secoes,
        (select count(*)::int from totalizacao_divergencia where lote_id = ${loteId}) as divergencias,
        (select count(*)::int from totalizacao_secao_erro where lote_id = ${loteId}) as secoes_com_erro
    `.execute(db);
    return {
      origem: 'totalizacao',
      ...mapearLote(totalizacao.rows[0]),
      ...(contagens.rows[0] ?? { secoes: null, divergencias: null, secoes_com_erro: null }),
    };
  }

  const bweb = await sql`
    select
      id as lote_id,
      nome_arquivo as arquivo,
      null::integer as ano_eleicao,
      null::smallint as nr_turno,
      null::varchar(2) as sg_uf,
      status,
      null::uuid as substituido_por,
      started_at as iniciado_em,
      imported_at as concluido_em,
      duracao_ms,
      erro_codigo,
      erro_mensagem
    from lote_importacao
    where id = ${loteId}
  `.execute(db);

  if (!bweb.rows[0]) return null;
  return { origem: 'bweb', ...mapearLote(bweb.rows[0]) };
}

function mapearLote(linha) {
  return {
    lote_id: linha.lote_id,
    arquivo: linha.arquivo,
    ano: linha.ano_eleicao,
    turno: linha.nr_turno,
    uf: linha.sg_uf,
    status: linha.status,
    iniciado_em: instante(linha.iniciado_em),
    concluido_em: instante(linha.concluido_em),
    duracao_ms: linha.duracao_ms ?? null,
    ...(linha.substituido_por ? { substituido_por: linha.substituido_por } : {}),
    ...(linha.erro_codigo ? { erro_codigo: linha.erro_codigo } : {}),
    ...(linha.erro_mensagem ? { erro_mensagem: linha.erro_mensagem } : {}),
  };
}

function instante(valor) {
  if (valor === null || valor === undefined) return null;
  return valor instanceof Date ? valor.toISOString() : valor;
}

function ufsSemArquivo(linhas) {
  return linhas
    .map((linha) => ({
      ano: linha.ano_eleicao,
      turno: linha.nr_turno,
      ufs: UFS.filter((uf) => !(linha.ufs ?? []).includes(uf)),
    }))
    .filter((linha) => linha.ufs.length > 0);
}

function duracao(ms) {
  if (ms === null || ms === undefined) return 'em andamento';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatarStatus(status) {
  if (status.origem) return formatarLote(status);

  const linhas = ['Última carga por ano/turno/UF'];
  if (status.ultima_por_uf.length === 0) linhas.push('  (nenhuma)');
  for (const item of status.ultima_por_uf) {
    linhas.push(
      `  ${item.ano} T${item.turno} ${item.uf}: ${item.status} ${item.arquivo} (${duracao(item.duracao_ms)})`,
    );
  }

  linhas.push('', 'Lotes parciais');
  if ((status.lotes_parciais ?? []).length === 0) linhas.push('  (nenhum)');
  for (const item of status.lotes_parciais ?? []) {
    const recorte = item.ano ? ` ${item.ano} T${item.turno} ${item.uf}` : '';
    linhas.push(`  ${item.origem}${recorte} ${item.lote_id} ${item.arquivo}`.trimEnd());
  }

  linhas.push('', 'Lotes com falha');
  if (status.lotes_com_falha.length === 0) linhas.push('  (nenhum)');
  for (const item of status.lotes_com_falha) {
    const recorte = item.ano ? ` ${item.ano} T${item.turno} ${item.uf}` : '';
    const erro = item.erro_codigo ? ` ${item.erro_codigo}: ${item.erro_mensagem ?? ''}` : '';
    linhas.push(`  ${item.origem}${recorte} ${item.lote_id} ${item.arquivo}${erro}`.trimEnd());
  }

  linhas.push('', 'Seções com erro');
  if ((status.secoes_com_erro ?? []).length === 0) linhas.push('  (nenhuma)');
  for (const item of status.secoes_com_erro ?? []) {
    const recorte = item.ano ? ` ${item.ano} T${item.turno} ${item.uf}` : '';
    linhas.push(
      `  ${item.lote_id}${recorte} ${item.prefixo} ${item.codigo}: ${item.mensagem}`.trimEnd(),
    );
  }

  linhas.push('', 'Lotes substituídos');
  if ((status.lotes_substituidos ?? []).length === 0) linhas.push('  (nenhum)');
  for (const item of status.lotes_substituidos ?? []) {
    const recorte = item.ano ? ` ${item.ano} T${item.turno} ${item.uf}` : '';
    linhas.push(`  ${item.lote_id}${recorte} ${item.arquivo} → ${item.substituido_por}`.trimEnd());
  }

  linhas.push('', 'UFs sem arquivo');
  if (status.ufs_sem_arquivo.length === 0) linhas.push('  (nenhuma)');
  for (const item of status.ufs_sem_arquivo) {
    linhas.push(`  ${item.ano} T${item.turno}: ${item.ufs.join(', ')}`);
  }

  return linhas.join('\n');
}

function formatarLote(lote) {
  const campos = [
    ['origem', lote.origem],
    ['arquivo', lote.arquivo],
    ['ano/turno/uf', lote.ano ? `${lote.ano} T${lote.turno} ${lote.uf}` : null],
    ['status', lote.status],
    ['substituido_por', lote.substituido_por],
    ['iniciado_em', lote.iniciado_em],
    ['concluido_em', lote.concluido_em],
    ['duracao_ms', lote.duracao_ms],
    ['secoes', lote.secoes],
    ['secoes_com_erro', lote.secoes_com_erro],
    ['divergencias', lote.divergencias],
    ['erro_codigo', lote.erro_codigo],
    ['erro_mensagem', lote.erro_mensagem],
  ];

  const linhas = [`lote ${lote.lote_id}`];
  for (const [nome, valor] of campos) {
    if (valor !== null && valor !== undefined) linhas.push(`  ${nome}: ${valor}`);
  }
  return linhas.join('\n');
}
