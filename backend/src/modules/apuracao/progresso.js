import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from './corte.js';

export async function contarSecoesComBu(db, { eleicaoId, cargo, corte, escopo = {} }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corte);
  qb = aplicarEscopo(qb, escopo);

  const { total } = await qb
    .select(sql`count(distinct bv.secao_id)`.as('total'))
    .executeTakeFirstOrThrow();

  return Number(total);
}

export async function calcularProgresso(db, escopo) {
  return { secoes_com_bu: await contarSecoesComBu(db, escopo) };
}
