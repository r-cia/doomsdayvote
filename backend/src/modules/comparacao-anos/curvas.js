import { sql } from 'kysely';

export const CARGO_PRESIDENTE = 1;
export const INTERVALO_MINUTOS = 5;

export async function eleicoesPresidente(db, anos) {
  const { rows } = await sql`
    select e.id, e.ano_eleicao, e.nr_turno, e.dt_pleito::text as dt_pleito
    from eleicao e
    where e.ano_eleicao in (${sql.join(anos)})
      and exists (
        select 1 from boletim_versao bv
        where bv.eleicao_id = e.id
          and bv.cd_cargo_pergunta = ${CARGO_PRESIDENTE}
          and bv.ativo = true
          and bv.cd_tipo_urna = 1
      )
    order by e.ano_eleicao, e.nr_turno, e.id
  `.execute(db);
  return rows;
}

export async function candidatosDoTurno(db, eleicaoId) {
  const { rows } = await sql`
    select nr_votavel, nm_votavel, sg_partido, qt_votos::float8 as qt_votos
    from mv_votos_final
    where eleicao_id = ${eleicaoId}
      and cargo = ${CARGO_PRESIDENTE}
      and categoria = 'nominal'
    order by qt_votos desc, nr_votavel
    limit 2
  `.execute(db);
  return rows;
}

export async function votosPorIntervalo(db, { eleicao, candidatos, uf }) {
  const [primeiro, segundo] = candidatos.map((candidato) => candidato.nr_votavel);
  const { rows } = await sql`
    select
      (extract(epoch from date_bin(
        ${`${INTERVALO_MINUTOS} minutes`}::interval,
        bv.dt_encerramento at time zone interval '-3 hours',
        timestamp '2000-01-01'
      ) - ${eleicao.dt_pleito}::date::timestamp) / 60)::int as minuto,
      sum(rv.qt_votos)::float8 as validos,
      coalesce(sum(rv.qt_votos) filter (where rv.categoria = 'nominal' and rv.nr_votavel = ${primeiro}), 0)::float8 as primeiro,
      coalesce(sum(rv.qt_votos) filter (where rv.categoria = 'nominal' and rv.nr_votavel = ${segundo ?? -1}), 0)::float8 as segundo
    from boletim_versao bv
    join resultado_votavel rv on rv.boletim_versao_id = bv.id
    ${uf ? sql`join secao_eleitoral s on s.id = bv.secao_id` : sql``}
    where bv.eleicao_id = ${eleicao.id}
      and bv.cd_cargo_pergunta = ${CARGO_PRESIDENTE}
      and bv.ativo = true
      and bv.cd_tipo_urna = 1
      and bv.dt_encerramento is not null
      and rv.qt_votos is not null
      and rv.categoria in ('nominal', 'legenda')
      ${uf ? sql`and s.sg_uf = ${uf}` : sql``}
    group by 1
    order by 1
  `.execute(db);
  return rows;
}

export function montarPontos(linhas, quantidadeCandidatos) {
  const colunas = ['primeiro', 'segundo'].slice(0, quantidadeCandidatos);
  const acumulados = colunas.map(() => 0);
  let validos = 0;

  return linhas.map((linha) => {
    validos += linha.validos;
    return {
      minuto: linha.minuto,
      candidatos: colunas.map((coluna, indice) => {
        acumulados[indice] += linha[coluna];
        return {
          votos: linha[coluna],
          pct_acumulada: validos > 0 ? (acumulados[indice] / validos) * 100 : null,
        };
      }),
    };
  });
}
