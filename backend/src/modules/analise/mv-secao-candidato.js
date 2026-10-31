export function linhasMvSecaoCandidato(db, { eleicaoId, cargo, escopo = {}, categorias = null }) {
  let consulta = db
    .selectFrom('mv_secao_candidato_final')
    .selectAll()
    .where('eleicao_id', '=', eleicaoId)
    .where('cargo', '=', cargo);
  if (categorias) consulta = consulta.where('categoria', 'in', categorias);
  if (escopo.sgUf) consulta = consulta.where('sg_uf', '=', escopo.sgUf);
  if (escopo.cdMunicipio) consulta = consulta.where('cd_municipio_tse', '=', escopo.cdMunicipio);
  if (escopo.nrZona) consulta = consulta.where('nr_zona', '=', escopo.nrZona);
  if (escopo.secaoId) consulta = consulta.where('secao_id', '=', escopo.secaoId);
  return consulta.execute();
}

export function agruparPorSecao(linhas) {
  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) porSecao.set(linha.secao_id, []);
    porSecao.get(linha.secao_id).push(linha);
  }
  return porSecao;
}
