import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';

function base(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  return aplicarEscopo(aplicarFiltroCorte(qb, corte), escopo);
}

function numero(valor) {
  if (valor === null || valor === undefined) return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

export async function eleicoesDoAno(db, { eleicao, cargo }) {
  const linhas = await db
    .selectFrom('eleicao as e')
    .select(['e.id', 'e.ano_eleicao', 'e.nr_turno'])
    .where('e.ano_eleicao', '=', eleicao.ano_eleicao)
    .where('e.nr_turno', 'in', [1, 2])
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom('boletim_versao as bv')
          .select('bv.id')
          .whereRef('bv.eleicao_id', '=', 'e.id')
          .where('bv.cd_cargo_pergunta', '=', cargo)
          .where('bv.ativo', '=', true),
      ),
    )
    .orderBy('e.nr_turno')
    .execute();

  const porTurno = new Map();
  for (const linha of linhas) {
    if (!porTurno.has(linha.nr_turno)) porTurno.set(linha.nr_turno, linha);
  }

  return [...porTurno.values()];
}

export async function estatisticasDaEleicao(
  db,
  { eleicao, cargo, corte, escopo = {} },
) {
  const recorte = { eleicaoId: eleicao.id, cargo, corte, escopo };

  const secoes = base(db, recorte)
    .select(['bv.secao_id'])
    .select(sql`max(bv.qt_comparecimento)`.as('comparecimento'))
    .groupBy('bv.secao_id');

  const [candidatos, comparecimento] = await Promise.all([
    base(db, recorte)
      .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
      .select([
        'rv.nr_votavel',
        sql`max(rv.nm_votavel)`.as('nm_votavel'),
        sql`max(rv.sg_partido)`.as('sg_partido'),
        sql`count(*)::int`.as('secoes'),
        sql`count(*) filter (where rv.qt_votos > 0)::int`.as('secoes_com_voto'),
        sql`avg(rv.qt_votos)`.as('media'),
        sql`percentile_cont(0.5) within group (order by rv.qt_votos)`.as('mediana'),
        sql`stddev_pop(rv.qt_votos)`.as('desvio'),
      ])
      .where('rv.categoria', '=', 'nominal')
      .where('rv.qt_votos', 'is not', null)
      .groupBy('rv.nr_votavel')
      .orderBy(sql`avg(rv.qt_votos) desc`)
      .execute(),
    db
      .selectFrom(secoes.as('t'))
      .select([
        sql`count(*)::int`.as('secoes'),
        sql`avg(t.comparecimento)`.as('media'),
        sql`percentile_cont(0.5) within group (order by t.comparecimento)`.as('mediana'),
        sql`stddev_pop(t.comparecimento)`.as('desvio'),
      ])
      .executeTakeFirst(),
  ]);

  return {
    eleicao_id: eleicao.id,
    ano_eleicao: eleicao.ano_eleicao,
    nr_turno: eleicao.nr_turno,
    comparecimento: {
      secoes: Number(comparecimento?.secoes ?? 0),
      media: numero(comparecimento?.media),
      mediana: numero(comparecimento?.mediana),
      desvio: numero(comparecimento?.desvio),
    },
    candidatos: candidatos.map((linha) => ({
      nr_votavel: linha.nr_votavel,
      nm_votavel: linha.nm_votavel,
      sg_partido: linha.sg_partido,
      secoes: Number(linha.secoes),
      secoes_com_voto: Number(linha.secoes_com_voto ?? 0),
      media: numero(linha.media),
      mediana: numero(linha.mediana),
      desvio: numero(linha.desvio),
    })),
  };
}
