import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';

export const REGRAS = [
  'comparecimento_vs_votos',
  'aptos_vs_comparecimento_abstencao',
  'comparecimento_vs_aptos',
  'biometria_vs_comparecimento',
];

export const COLUNAS_CONSISTENCIA = ['sg_uf', 'nm_municipio', 'nr_zona', 'nr_secao', 'regra', 'diferenca'];

function ausente(valor) {
  return valor === null || valor === undefined;
}

export function validarConsistenciaBu(bu = {}, resultados = []) {
  const b = bu ?? {};
  const regras = [];

  // comparecimento_vs_votos
  {
    const comparecimento = b.qt_comparecimento;
    const lista = Array.isArray(resultados) ? resultados : null;
    const agregado = !lista && resultados && typeof resultados === 'object' ? resultados : null;
    let soma = lista ? 0 : Number(agregado?.somaVotos ?? 0);
    let temNulo = agregado?.temVotosNulos === true;
    let insuficiente =
      ausente(comparecimento) ||
      (lista === null && agregado === null) ||
      agregado?.temResultados === false;
    if (lista) {
      for (const item of lista) {
        if (ausente(item?.qt_votos)) {
          temNulo = true;
        } else {
          soma += Number(item.qt_votos);
        }
      }
    }
    if (temNulo) insuficiente = true;
    const diferenca = insuficiente ? null : soma - Number(comparecimento);
    regras.push({
      regra: 'comparecimento_vs_votos',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca === 0
          ? 'ok'
          : 'divergente',
      diferenca,
      campos: ['qt_comparecimento', 'qt_votos'],
      valores: {
        qt_comparecimento: comparecimento ?? null,
        soma_qt_votos: insuficiente ? null : soma,
      },
    });
  }

  // aptos_vs_comparecimento_abstencao
  {
    const aptos = b.qt_aptos;
    const comparecimento = b.qt_comparecimento;
    const abstencoes = b.qt_abstencoes;
    const insuficiente = ausente(aptos) || ausente(comparecimento) || ausente(abstencoes);
    const soma = insuficiente ? null : Number(comparecimento) + Number(abstencoes);
    const diferenca = insuficiente ? null : Number(aptos) - soma;
    regras.push({
      regra: 'aptos_vs_comparecimento_abstencao',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca === 0
          ? 'ok'
          : 'divergente',
      diferenca,
      campos: ['qt_aptos', 'qt_comparecimento', 'qt_abstencoes'],
      valores: {
        qt_aptos: aptos ?? null,
        qt_comparecimento: comparecimento ?? null,
        qt_abstencoes: abstencoes ?? null,
        soma_comparecimento_abstencoes: soma,
      },
    });
  }

  // comparecimento_vs_aptos
  {
    const comparecimento = b.qt_comparecimento;
    const aptos = b.qt_aptos;
    const insuficiente = ausente(comparecimento) || ausente(aptos);
    const diferenca = insuficiente ? null : Number(comparecimento) - Number(aptos);
    regras.push({
      regra: 'comparecimento_vs_aptos',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca > 0
          ? 'divergente'
          : 'ok',
      diferenca,
      campos: ['qt_comparecimento', 'qt_aptos'],
      valores: {
        qt_comparecimento: comparecimento ?? null,
        qt_aptos: aptos ?? null,
      },
    });
  }

  // biometria_vs_comparecimento
  {
    const biometria = b.qt_elei_biom_sem_habilitacao;
    const comparecimento = b.qt_comparecimento;
    const insuficiente = ausente(biometria) || ausente(comparecimento);
    const diferenca = insuficiente ? null : Number(biometria) - Number(comparecimento);
    regras.push({
      regra: 'biometria_vs_comparecimento',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca > 0
          ? 'divergente'
          : 'ok',
      diferenca,
      campos: ['qt_elei_biom_sem_habilitacao', 'qt_comparecimento'],
      valores: {
        qt_elei_biom_sem_habilitacao: biometria ?? null,
        qt_comparecimento: comparecimento ?? null,
      },
    });
  }

  return regras;
}

const COLUNAS_BU = [
  's.id as secao_id',
  's.sg_uf',
  's.cd_municipio_tse',
  's.nr_zona',
  's.nr_secao',
  's.nr_local_votacao',
  'l.nm_municipio',
  'bv.id as bu_id',
  'bv.versao',
  'bv.qt_aptos',
  'bv.qt_comparecimento',
  'bv.qt_abstencoes',
  'bv.qt_elei_biom_sem_habilitacao',
  'bv.dt_abertura',
  'bv.dt_encerramento',
  'bv.dt_emissao_bu',
  'bv.dt_bu_recebido_ts',
  'bv.dt_bu_recebido_data',
  'bv.imported_at',
  'lot.id as lote_id',
  'lot.nome_arquivo as lote_nome',
  'lot.sha256 as lote_sha256',
  'lot.dt_geracao_arquivo',
  'lot.captured_at',
];

const COLUNAS_RESULTADOS = [
  sql`coalesce(r.soma_votos, 0)::bigint`.as('soma_votos'),
  sql`coalesce(r.resultados_considerados, 0)::int`.as('resultados_considerados'),
  sql`coalesce(r.tem_votos_nulos, false)`.as('tem_votos_nulos'),
];

// Os status e as diferenças espelham validarConsistenciaBu; o teste de integração compara os dois caminhos.
const REGRAS_SQL = [
  {
    insuficiente: sql`bu.qt_comparecimento is null or bu.resultados_considerados = 0 or bu.tem_votos_nulos`,
    diferenca: sql`bu.soma_votos - bu.qt_comparecimento`,
    divergente: (dif) => sql`${dif} <> 0`,
  },
  {
    insuficiente: sql`bu.qt_aptos is null or bu.qt_comparecimento is null or bu.qt_abstencoes is null`,
    diferenca: sql`bu.qt_aptos - (bu.qt_comparecimento + bu.qt_abstencoes)`,
    divergente: (dif) => sql`${dif} <> 0`,
  },
  {
    insuficiente: sql`bu.qt_comparecimento is null or bu.qt_aptos is null`,
    diferenca: sql`bu.qt_comparecimento - bu.qt_aptos`,
    divergente: (dif) => sql`${dif} > 0`,
  },
  {
    insuficiente: sql`bu.qt_elei_biom_sem_habilitacao is null or bu.qt_comparecimento is null`,
    diferenca: sql`bu.qt_elei_biom_sem_habilitacao - bu.qt_comparecimento`,
    divergente: (dif) => sql`${dif} > 0`,
  },
];

// Os resultados são agregados em uma única varredura por (ano, turno, cargo), e não por BU com busca no índice:
// a busca por BU faz uma leitura aleatória por boletim e leva minutos num disco rotativo.
function agregadoDeResultados(eb, { eleicao, cargo, escopo }) {
  let resultados = eb
    .selectFrom('resultado_votavel as rv')
    .select([
      'rv.boletim_versao_id',
      sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('soma_votos'),
      sql`count(rv.id)::int`.as('resultados_considerados'),
      sql`coalesce(bool_or(rv.qt_votos is null), false)`.as('tem_votos_nulos'),
    ])
    .where('rv.ano_eleicao', '=', eleicao.ano_eleicao)
    .where('rv.nr_turno', '=', eleicao.nr_turno)
    .where('rv.cd_cargo_pergunta', '=', cargo);
  if (escopo?.sgUf) resultados = resultados.where('rv.sg_uf', '=', escopo.sgUf);
  return resultados.groupBy('rv.boletim_versao_id').as('r');
}

function consultaBase(db, { eleicaoId, eleicao, cargo, corte, escopo }) {
  let bus = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .leftJoin('lote_importacao as lot', 'lot.id', 'bv.lote_id')
    .leftJoin(
      (eb) => agregadoDeResultados(eb, { eleicao, cargo, escopo }),
      (join) => join.onRef('r.boletim_versao_id', '=', 'bv.id'),
    )
    .select([...COLUNAS_BU, ...COLUNAS_RESULTADOS])
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  bus = aplicarFiltroCorte(bus, corte ?? { tipo: 'final' });
  bus = aplicarEscopo(bus, escopo ?? {});

  return db.with('bu', () => bus).with('calc', (qc) =>
    qc.selectFrom('bu').selectAll('bu').select(
      REGRAS_SQL.flatMap((regra, indice) => {
        const n = indice + 1;
        return [
          sql`(${regra.insuficiente})`.as(`insuf_${n}`),
          sql`${regra.diferenca}`.as(`dif_${n}`),
          sql`(not (${regra.insuficiente}) and ${regra.divergente(regra.diferenca)})`.as(`div_${n}`),
        ];
      }),
    ),
  );
}

async function coberturaDoRecorte(base) {
  const contagens = REGRAS_SQL.flatMap((_, indice) => {
    const n = indice + 1;
    return [
      sql`count(*) filter (where insuf_${sql.raw(String(n))})::int`.as(`sem_campo_${n}`),
      sql`count(*) filter (where div_${sql.raw(String(n))})::int`.as(`divergencias_${n}`),
    ];
  });
  const todasInsuficientes = sql`insuf_1 and insuf_2 and insuf_3 and insuf_4`;
  const algumaDivergente = sql`div_1 or div_2 or div_3 or div_4`;

  const [linha] = await base
    .selectFrom('calc')
    .select([
      sql`count(*)::int`.as('consideradas'),
      sql`count(*) filter (where ${algumaDivergente})::int`.as('com_divergencia'),
      sql`count(*) filter (where not (${todasInsuficientes}))::int`.as('avaliadas'),
      sql`count(*) filter (where not (${todasInsuficientes}) and not (${algumaDivergente}))::int`.as('sem_divergencia'),
      ...contagens,
    ])
    .execute();

  return {
    consideradas: linha.consideradas,
    com_divergencia: linha.com_divergencia,
    avaliadas: linha.avaliadas,
    sem_divergencia: linha.sem_divergencia,
    sem_campo_por_regra: Object.fromEntries(REGRAS.map((regra, i) => [regra, linha[`sem_campo_${i + 1}`]])),
    divergencias_por_regra: Object.fromEntries(REGRAS.map((regra, i) => [regra, linha[`divergencias_${i + 1}`]])),
  };
}

function montarItem(linha) {
  const regras = validarConsistenciaBu(
    {
      qt_aptos: linha.qt_aptos,
      qt_comparecimento: linha.qt_comparecimento,
      qt_abstencoes: linha.qt_abstencoes,
      qt_elei_biom_sem_habilitacao: linha.qt_elei_biom_sem_habilitacao,
    },
    {
      somaVotos: linha.soma_votos,
      temResultados: Number(linha.resultados_considerados) > 0,
      temVotosNulos: linha.tem_votos_nulos,
    },
  );
  const regra = regras[linha.indice_regra - 1];
  return {
    secao: {
      id: linha.secao_id,
      sg_uf: linha.sg_uf,
      cd_municipio_tse: linha.cd_municipio_tse,
      nm_municipio: linha.nm_municipio,
      nr_zona: linha.nr_zona,
      nr_secao: linha.nr_secao,
      nr_local_votacao: linha.nr_local_votacao,
    },
    regra: regra.regra,
    diferenca: regra.diferenca,
    campos: regra.campos,
    valores: regra.valores,
    bu: {
      id: linha.bu_id,
      versao: linha.versao,
      lote: { id: linha.lote_id, nome: linha.lote_nome },
      sha256: linha.lote_sha256,
      timestamps: {
        dt_abertura: linha.dt_abertura,
        dt_encerramento: linha.dt_encerramento,
        dt_emissao_bu: linha.dt_emissao_bu,
        dt_bu_recebido_ts: linha.dt_bu_recebido_ts,
        dt_bu_recebido_data: linha.dt_bu_recebido_data,
        imported_at: linha.imported_at,
        dt_geracao_arquivo: linha.dt_geracao_arquivo,
        captured_at: linha.captured_at,
      },
    },
  };
}

async function paginaDeDivergencias(base, { regra, ordenacao, limite, deslocamento }) {
  const indices = regra ? [REGRAS.indexOf(regra) + 1] : REGRAS.map((_, i) => i + 1);
  const porRegra = indices.map(
    (n) => sql`
      select calc.*, ${sql.lit(n)}::int as indice_regra, ${sql.lit(REGRAS[n - 1])}::text as regra, calc.${sql.id(`dif_${n}`)} as diferenca
      from calc
      where calc.${sql.id(`div_${n}`)}
    `,
  );
  const uniao = sql`(${sql.join(porRegra, sql` union all `)})`;

  const desempate = ['sg_uf', 'cd_municipio_tse', 'nr_zona', 'nr_secao', 'indice_regra'];
  let consulta = base.with('itens', () => uniao).selectFrom('itens').selectAll();
  if (ordenacao && COLUNAS_CONSISTENCIA.includes(ordenacao.ordem)) {
    const direcao = ordenacao.direcao === 'desc' ? sql`desc` : sql`asc`;
    consulta = consulta.orderBy(sql`${sql.ref(ordenacao.ordem)} ${direcao} nulls last`);
  }
  for (const coluna of desempate) consulta = consulta.orderBy(coluna);

  const linhas = await consulta.limit(limite).offset(deslocamento).execute();
  return linhas.map(montarItem);
}

export async function consistenciaPorSecao(db, { eleicaoId, cargo, corte, escopo, regra, ordenacao, limite, deslocamento }) {
  const eleicao = await db
    .selectFrom('eleicao')
    .select(['ano_eleicao', 'nr_turno'])
    .where('id', '=', eleicaoId)
    .executeTakeFirstOrThrow();
  const base = consultaBase(db, { eleicaoId, eleicao, cargo, corte, escopo });
  const [cobertura, itens] = await Promise.all([
    coberturaDoRecorte(base),
    paginaDeDivergencias(base, { regra, ordenacao, limite, deslocamento }),
  ]);
  const total = regra
    ? cobertura.divergencias_por_regra[regra]
    : Object.values(cobertura.divergencias_por_regra).reduce((soma, valor) => soma + valor, 0);
  return { cobertura, total, itens };
}
