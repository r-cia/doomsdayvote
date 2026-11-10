export async function registrarIntervencao(
  db,
  { loteId, prefixo, fonte, posicao = null, tipo, descricao, impacto },
) {
  await db
    .insertInto('totalizacao_intervencao')
    .values({
      lote_id: loteId,
      prefixo,
      fonte,
      posicao,
      tipo,
      descricao,
      impacto,
    })
    .execute();
}

export async function listarIntervencoes(db, loteId) {
  return db
    .selectFrom('totalizacao_intervencao')
    .selectAll()
    .where('lote_id', '=', loteId)
    .orderBy('prefixo')
    .orderBy('id')
    .execute();
}
