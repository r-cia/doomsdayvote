import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from './corte.js';

export async function linhaDoTempo(db, { eleicaoId, cargo, corte, escopo, granularidade, porCandidato }) {
  const intervalo = granularidade === '1m' ? '1 minute' : '5 minutes';
  const baseTimeline = () => {
    const qb = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.precisao_dt_bu_recebido', '=', 'DATA_HORA')
      .where('bv.eleicao_id', '=', eleicaoId)
      .where('bv.cd_cargo_pergunta', '=', cargo);
    return aplicarEscopo(aplicarFiltroCorte(qb, corte), escopo);
  };
  const instante = sql`date_bin(${intervalo}::interval, bv.dt_bu_recebido_ts, timestamptz '2000-01-01')`.as('t');

  const rows = await baseTimeline()
    .select([
      instante,
      sql`sum(rv.qt_votos)`.as('votos'),
      sql`count(distinct bv.secao_id)`.as('secoes'),
    ])
    .groupBy(sql`1`)
    .orderBy(sql`1`)
    .execute();

  let votos = 0;
  let secoes = 0;
  const pontos = rows.map((linha) => {
    votos += Number(linha.votos);
    secoes += Number(linha.secoes);
    return {
      t: new Date(linha.t).toISOString(),
      votos_acumulados: votos,
      secoes_com_bu_acumuladas: secoes,
    };
  });

  let series = null;
  if (porCandidato) {
    const linhas = await baseTimeline()
      .select([
        instante,
        'rv.nr_votavel',
        sql`max(rv.nm_votavel)`.as('nm_votavel'),
        sql`sum(rv.qt_votos)`.as('votos'),
      ])
      .where('rv.categoria', '=', 'nominal')
      .where('rv.qt_votos', 'is not', null)
      .groupBy([sql`1`, sql`2`])
      .orderBy(sql`1`)
      .orderBy(sql`2`)
      .execute();

    const acumulado = new Map();
    for (const linha of linhas) {
      if (!acumulado.has(linha.nr_votavel)) {
        acumulado.set(linha.nr_votavel, {
          nr_votavel: linha.nr_votavel,
          nm_votavel: linha.nm_votavel,
          total: 0,
          pontos: [],
        });
      }
      const serie = acumulado.get(linha.nr_votavel);
      serie.total += Number(linha.votos);
      serie.pontos.push({
        t: new Date(linha.t).toISOString(),
        votos_acumulados: serie.total,
      });
    }

    series = [...acumulado.values()].map(({ total, ...serie }) => serie);
  }

  return { pontos, series };
}
