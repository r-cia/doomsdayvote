import { sql } from 'kysely';

export async function preencherSiglaExterior(db) {
  // O arquivo de 2014 do exterior (ZZ) só traz NR_PARTIDO; a sigla vem de mv_votos_final para evitar varrer resultado_votavel.
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
  await sql`refresh materialized view mv_votos_final`.execute(db);
  await sql`refresh materialized view mv_totais_area`.execute(db);
  await sql`refresh materialized view mv_secao_candidato_final`.execute(db);
}

export async function up(db) {
  await preencherSiglaExterior(db);
  await atualizarViews(db);
}

export async function down(db) {
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
}
