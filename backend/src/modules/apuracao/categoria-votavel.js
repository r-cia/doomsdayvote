function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function categorizar({ cd_tipo_votavel, ds_tipo_votavel, nr_votavel }) {
  if (nr_votavel === 95) return 'branco';
  if (nr_votavel === 96) return 'nulo';
  if (nr_votavel === 97) return 'anulado_apurado_separado';
  if (nr_votavel === 98) return 'anulado';
  if (cd_tipo_votavel === 1) return 'nominal';
  if (normalizarTexto(ds_tipo_votavel) === 'legenda') return 'legenda';
  return 'outro';
}
