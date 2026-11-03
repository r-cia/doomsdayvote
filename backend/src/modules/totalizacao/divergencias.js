function linha(loteId, divergencia) {
  return {
    lote_id: loteId,
    fonte: divergencia.fonte,
    campo: divergencia.campo,
    sg_uf: divergencia.sg_uf,
    cd_municipio_tse: divergencia.cd_municipio_tse ?? null,
    nr_zona: divergencia.nr_zona ?? null,
    nr_secao: divergencia.nr_secao ?? null,
    cd_cargo_pergunta: divergencia.cd_cargo_pergunta ?? null,
    nr_votavel: divergencia.nr_votavel ?? null,
    valor_esperado: divergencia.valor_esperado,
    valor_encontrado: divergencia.valor_encontrado,
  };
}

export async function registrarDivergencias(db, loteId, divergencias) {
  if (divergencias.length === 0) return 0;

  const inseridas = await db
    .insertInto('totalizacao_divergencia')
    .values(divergencias.map((divergencia) => linha(loteId, divergencia)))
    .onConflict((oc) => oc.doNothing())
    .returning('id')
    .execute();

  return inseridas.length;
}

export async function listarDivergencias(db, loteId, { fonte } = {}) {
  let consulta = db
    .selectFrom('totalizacao_divergencia')
    .selectAll()
    .where('lote_id', '=', loteId)
    .orderBy('sg_uf')
    .orderBy('cd_municipio_tse')
    .orderBy('nr_zona')
    .orderBy('nr_secao')
    .orderBy('fonte')
    .orderBy('campo')
    .orderBy('nr_votavel');

  if (fonte !== undefined) consulta = consulta.where('fonte', '=', fonte);

  return consulta.execute();
}

export function divergenciaDeAusencia({
  fonte,
  campo,
  sgUf,
  cdMunicipioTse,
  nrZona,
  nrSecao,
  cdCargoPergunta,
  nrVotavel,
}) {
  return {
    fonte,
    campo,
    sg_uf: sgUf,
    cd_municipio_tse: cdMunicipioTse ?? null,
    nr_zona: nrZona ?? null,
    nr_secao: nrSecao ?? null,
    cd_cargo_pergunta: cdCargoPergunta ?? null,
    nr_votavel: nrVotavel ?? null,
    valor_esperado: 'presente',
    valor_encontrado: 'ausente',
  };
}
