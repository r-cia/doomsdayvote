export async function gerarRelatorioLote(db, loteId) {
  const lote = await db
    .selectFrom('lote_importacao')
    .selectAll()
    .where('id', '=', loteId)
    .executeTakeFirst();

  const itens = await db
    .selectFrom('alerta_importacao')
    .selectAll()
    .where('lote_id', '=', loteId)
    .orderBy('created_at', 'asc')
    .execute();

  const mapa = new Map();
  for (const item of itens) {
    const chave = `${item.codigo}|${item.severidade}`;
    const atual = mapa.get(chave) ?? { codigo: item.codigo, severidade: item.severidade, quantidade: 0 };
    atual.quantidade += 1;
    mapa.set(chave, atual);
  }

  return {
    lote,
    totais: {
      erros: lote?.qt_erros ?? 0,
      alertas: lote?.qt_alertas ?? 0,
    },
    porCodigo: [...mapa.values()].sort((a, b) => b.quantidade - a.quantidade),
    itens,
  };
}
