import { sql } from 'kysely';

const FILTROS_OPCIONAIS = Object.freeze([
  ['loteId', 'lote_id'],
  ['sgUf', 'sg_uf'],
  ['cdMunicipioTse', 'cd_municipio_tse'],
  ['nrZona', 'nr_zona'],
  ['nrSecao', 'nr_secao'],
]);

function filtroDoRecorte(recorte, alias, lotes) {
  const condicoes = [
    sql`${sql.ref(`${alias}.ano_eleicao`)} = ${recorte.anoEleicao}`,
    sql`${sql.ref(`${alias}.nr_turno`)} = ${recorte.nrTurno}`,
    filtroLotes(lotes, alias),
  ];

  for (const [chave, coluna] of FILTROS_OPCIONAIS) {
    const valor = recorte[chave];
    if (valor !== undefined && valor !== null) {
      condicoes.push(sql`${sql.ref(`${alias}.${coluna}`)} = ${valor}`);
    }
  }

  return sql.join(condicoes, sql` and `);
}

const STATUS_VIGENTES = ['concluido', 'parcial'];

export async function lotesVigentes(db, recorte) {
  let consulta = db
    .selectFrom('totalizacao_lote as l')
    .select('l.id')
    .where('l.status', 'in', STATUS_VIGENTES)
    .where('l.ano_eleicao', '=', recorte.anoEleicao)
    .where('l.nr_turno', '=', recorte.nrTurno);

  if (recorte.sgUf) consulta = consulta.where('l.sg_uf', '=', recorte.sgUf);

  if (recorte.loteId !== undefined && recorte.loteId !== null) {
    consulta = consulta.where('l.id', '=', recorte.loteId);
  } else {
    consulta = consulta.where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom('totalizacao_lote as n')
            .select('n.id')
            .whereRef('n.sg_uf', '=', 'l.sg_uf')
            .whereRef('n.ano_eleicao', '=', 'l.ano_eleicao')
            .whereRef('n.nr_turno', '=', 'l.nr_turno')
            .where('n.status', 'in', STATUS_VIGENTES)
            .whereRef('n.iniciado_em', '>', 'l.iniciado_em'),
        ),
      ),
    );
  }

  return (await consulta.execute()).map((lote) => lote.id);
}

export function filtroLotes(lotes, alias) {
  if (lotes.length === 0) return sql`false`;
  return sql`${sql.ref(`${alias}.lote_id`)} in (${sql.join(lotes)})`;
}

const CAMPOS_SOMADOS = Object.freeze([
  'qtDuracao',
  'somaMs',
  'falhou1',
  'falhou2',
  'falhou3',
  'falhou4',
  'manual',
  'incidentes',
  'secoes',
  'aptos',
  'comparecimento',
  'teclas',
  'correcoes',
]);

const COLUNA_DO_CAMPO = Object.freeze({
  qtDuracao: 'qt_duracao',
  somaMs: 'soma_ms',
  falhou1: 'falhou_1',
  falhou2: 'falhou_2',
  falhou3: 'falhou_3',
  falhou4: 'falhou_4',
});

function parcialVazio() {
  const parcial = { minMs: null, maxMs: null, histograma: new Map(), medianaExataMs: null };
  for (const campo of CAMPOS_SOMADOS) parcial[campo] = 0;
  return parcial;
}

function menorEntre(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

function maiorEntre(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

function juntar(a, b) {
  const junto = parcialVazio();
  for (const campo of CAMPOS_SOMADOS) junto[campo] = a[campo] + b[campo];
  junto.minMs = menorEntre(a.minMs, b.minMs);
  junto.maxMs = maiorEntre(a.maxMs, b.maxMs);
  for (const origem of [a.histograma, b.histograma]) {
    for (const [segundo, balde] of origem) {
      const atual = junto.histograma.get(segundo) ?? { qt: 0, somaMs: 0 };
      junto.histograma.set(segundo, { qt: atual.qt + balde.qt, somaMs: atual.somaMs + balde.somaMs });
    }
  }
  return junto;
}

function medianaDoHistograma(histograma, total) {
  if (total === 0) return null;
  const baldes = [...histograma.entries()].sort((x, y) => x[0] - y[0]);
  const posicoes = total % 2 === 1 ? [(total + 1) / 2] : [total / 2, total / 2 + 1];

  const valores = posicoes.map((posicao) => {
    let acumulado = 0;
    for (const [, balde] of baldes) {
      acumulado += balde.qt;
      if (acumulado >= posicao) return balde.somaMs / balde.qt;
    }
    return null;
  });

  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

async function lotesComMetrica(db, lotes) {
  if (lotes.length === 0) return new Set();
  const linhas = await db
    .selectFrom('totalizacao_zona_metrica')
    .select('lote_id')
    .distinct()
    .where('lote_id', 'in', lotes)
    .execute();
  return new Set(linhas.map((linha) => linha.lote_id));
}

async function agregarDasMetricas(db, recorte, lotes) {
  const filtros = [filtroLotes(lotes, 'z')];
  const histogramaFiltros = [filtroLotes(lotes, 'z')];
  for (const [chave, coluna] of [
    ['cdMunicipioTse', 'cd_municipio_tse'],
    ['nrZona', 'nr_zona'],
  ]) {
    const valor = recorte[chave];
    if (valor !== undefined && valor !== null) {
      filtros.push(sql`${sql.ref(`z.${coluna}`)} = ${valor}`);
      histogramaFiltros.push(sql`${sql.ref(`z.${coluna}`)} = ${valor}`);
    }
  }

  const [somas, baldes] = await Promise.all([
    sql`
      select
        coalesce(sum(z.qt_duracao), 0)::bigint as qt_duracao,
        coalesce(sum(z.soma_duracao_ms), 0)::bigint as soma_ms,
        min(z.min_duracao_ms)::int as min_ms,
        max(z.max_duracao_ms)::int as max_ms,
        coalesce(sum(z.falhou_1), 0)::bigint as falhou_1,
        coalesce(sum(z.falhou_2), 0)::bigint as falhou_2,
        coalesce(sum(z.falhou_3), 0)::bigint as falhou_3,
        coalesce(sum(z.falhou_4), 0)::bigint as falhou_4,
        coalesce(sum(z.manual), 0)::bigint as manual,
        coalesce(sum(z.qt_incidentes), 0)::bigint as incidentes,
        coalesce(sum(z.qt_secoes), 0)::bigint as secoes,
        coalesce(sum(z.qt_aptos), 0)::bigint as aptos,
        coalesce(sum(z.qt_comparecimento), 0)::bigint as comparecimento,
        coalesce(sum(z.teclas_indevidas), 0)::bigint as teclas,
        coalesce(sum(z.correcoes), 0)::bigint as correcoes
      from totalizacao_zona_metrica z
      where ${sql.join(filtros, sql` and `)}
    `.execute(db),
    sql`
      select z.segundo, sum(z.qt)::bigint as qt, sum(z.soma_ms)::bigint as soma_ms
      from totalizacao_zona_duracao z
      where ${sql.join(histogramaFiltros, sql` and `)}
      group by z.segundo
    `.execute(db),
  ]);

  const linha = somas.rows[0];
  const parcial = parcialVazio();
  for (const campo of CAMPOS_SOMADOS) {
    parcial[campo] = Number(linha[COLUNA_DO_CAMPO[campo] ?? campo]);
  }
  parcial.minMs = linha.min_ms === null ? null : Number(linha.min_ms);
  parcial.maxMs = linha.max_ms === null ? null : Number(linha.max_ms);
  for (const balde of baldes.rows) {
    parcial.histograma.set(Number(balde.segundo), {
      qt: Number(balde.qt),
      somaMs: Number(balde.soma_ms),
    });
  }
  return parcial;
}

async function agregarDosEleitores(db, recorte, lotes, { histograma }) {
  const [tempoBiometria, incidentes, complementares, baldes] = await Promise.all([
    sql`
      select
        count(e.duracao_ms)::bigint as qt_duracao,
        coalesce(sum(e.duracao_ms), 0)::bigint as soma_ms,
        percentile_cont(0.5) within group (order by e.duracao_ms) as mediana_ms,
        min(e.duracao_ms)::int as mais_rapido_ms,
        max(e.duracao_ms)::int as mais_demora_ms,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 1))::int as falhou_1,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 2))::int as falhou_2,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria = 3))::int as falhou_3,
        (count(*) filter (where e.tp_habilitacao = 2 and e.qt_falhas_biometria >= 4))::int as falhou_4,
        (count(*) filter (where e.tp_habilitacao = 3))::int as manual
      from totalizacao_eleitor e
      join totalizacao_secao s on s.id = e.totalizacao_secao_id
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
    sql`
      select count(*)::int as total
      from totalizacao_incidente i
      join totalizacao_secao s on s.id = i.totalizacao_secao_id
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
    sql`
      select
        count(distinct (s.sg_uf, s.cd_municipio_tse, s.nr_zona, s.nr_secao))::int as secoes,
        coalesce(sum(s.qt_aptos), 0)::bigint as aptos,
        coalesce(sum(s.qt_comparecimento), 0)::bigint as comparecimento,
        coalesce(sum(eleitor.teclas_indevidas), 0)::bigint as teclas_indevidas,
        coalesce(sum(eleitor.correcoes), 0)::bigint as correcoes
      from totalizacao_secao s
      left join lateral (
        select
          sum(e.qt_teclas_indevidas) as teclas_indevidas,
          count(*) filter (where e.correcao) as correcoes
        from totalizacao_eleitor e
        where e.totalizacao_secao_id = s.id
      ) eleitor on true
      where ${filtroDoRecorte(recorte, 's', lotes)}
    `.execute(db),
    histograma
      ? sql`
          select (e.duracao_ms / 1000)::int as segundo, count(*)::bigint as qt, sum(e.duracao_ms)::bigint as soma_ms
          from totalizacao_eleitor e
          join totalizacao_secao s on s.id = e.totalizacao_secao_id
          where e.duracao_ms is not null and ${filtroDoRecorte(recorte, 's', lotes)}
          group by 1
        `.execute(db)
      : { rows: [] },
  ]);

  const tempo = tempoBiometria.rows[0];
  const totais = complementares.rows[0];
  const parcial = parcialVazio();
  Object.assign(parcial, {
    qtDuracao: Number(tempo.qt_duracao),
    somaMs: Number(tempo.soma_ms),
    minMs: tempo.mais_rapido_ms === null ? null : Number(tempo.mais_rapido_ms),
    maxMs: tempo.mais_demora_ms === null ? null : Number(tempo.mais_demora_ms),
    medianaExataMs: tempo.mediana_ms === null ? null : Number(tempo.mediana_ms),
    falhou1: Number(tempo.falhou_1),
    falhou2: Number(tempo.falhou_2),
    falhou3: Number(tempo.falhou_3),
    falhou4: Number(tempo.falhou_4),
    manual: Number(tempo.manual),
    incidentes: Number(incidentes.rows[0].total),
    secoes: Number(totais.secoes),
    aptos: Number(totais.aptos),
    comparecimento: Number(totais.comparecimento),
    teclas: Number(totais.teclas_indevidas),
    correcoes: Number(totais.correcoes),
  });
  for (const balde of baldes.rows) {
    parcial.histograma.set(Number(balde.segundo), {
      qt: Number(balde.qt),
      somaMs: Number(balde.soma_ms),
    });
  }
  return parcial;
}

export async function agregarMetricas(db, recorte) {
  if (recorte?.anoEleicao === undefined || recorte?.nrTurno === undefined) {
    throw new Error('recorte exige anoEleicao e nrTurno');
  }

  const lotes = await lotesVigentes(db, recorte);
  const porSecao = recorte.nrSecao !== undefined && recorte.nrSecao !== null;
  const comMetrica = porSecao ? new Set() : await lotesComMetrica(db, lotes);
  const semMetrica = lotes.filter((lote) => !comMetrica.has(lote));
  const misto = comMetrica.size > 0;

  const [dasMetricas, dosEleitores] = await Promise.all([
    misto ? agregarDasMetricas(db, recorte, [...comMetrica]) : parcialVazio(),
    misto && semMetrica.length === 0
      ? parcialVazio()
      : agregarDosEleitores(db, recorte, semMetrica, { histograma: misto }),
  ]);

  const total = juntar(dasMetricas, dosEleitores);
  const medianaMs = misto
    ? medianaDoHistograma(total.histograma, total.qtDuracao)
    : dosEleitores.medianaExataMs;

  return {
    tempo: {
      quantidade: total.qtDuracao,
      mediaMs: total.qtDuracao === 0 ? null : total.somaMs / total.qtDuracao,
      medianaMs,
      maisRapidoMs: total.minMs,
      maisDemoradoMs: total.maxMs,
    },
    biometria: {
      falhou1: total.falhou1,
      falhou2: total.falhou2,
      falhou3: total.falhou3,
      falhou4: total.falhou4,
      manual: total.manual,
    },
    incidentes: {
      total: total.incidentes,
    },
    complementares: {
      secoes: total.secoes,
      aptos: total.aptos,
      comparecimento: total.comparecimento,
      teclasIndevidas: total.teclas,
      correcoes: total.correcoes,
    },
  };
}
