const TIPO_NOMINAL = 1;

export function votosDoBu(bu) {
  return bu.cargos.flatMap((cargo) =>
    cargo.votaveis.map((votavel) => ({
      cd_cargo_pergunta: cargo.identificador,
      cd_tipo_votavel: votavel.tipo,
      nr_votavel: votavel.numero,
      qt_votos: votavel.quantidade,
    })),
  );
}

function acumularVotos(votos) {
  const porChave = new Map();

  for (const voto of votos) {
    const numero = voto.cd_tipo_votavel === TIPO_NOMINAL ? voto.nr_votavel : null;
    const chave = `${voto.cd_cargo_pergunta}:${voto.cd_tipo_votavel}:${numero ?? 'nulo'}`;
    const atual = porChave.get(chave);
    if (atual) {
      atual.qt_votos += voto.qt_votos;
      continue;
    }
    porChave.set(chave, {
      cd_cargo_pergunta: voto.cd_cargo_pergunta,
      cd_tipo_votavel: voto.cd_tipo_votavel,
      nr_votavel: numero,
      qt_votos: voto.qt_votos,
    });
  }

  return porChave;
}

function chaveVoto(voto) {
  return `${voto.cd_cargo_pergunta}:${voto.cd_tipo_votavel}:${voto.nr_votavel ?? 'nulo'}`;
}

export function compararVotos({ esperados, encontrados }) {
  const esquerda = acumularVotos(esperados);
  const direita = acumularVotos(encontrados);

  const referencias = new Map(esquerda);
  for (const [chaveDireita, voto] of direita) {
    if (!referencias.has(chaveDireita)) referencias.set(chaveDireita, voto);
  }

  return [...referencias.values()]
    .map((referencia) => ({
      referencia,
      esperado: esquerda.get(chaveVoto(referencia))?.qt_votos ?? 0,
      encontrado: direita.get(chaveVoto(referencia))?.qt_votos ?? 0,
    }))
    .filter(({ esperado, encontrado }) => esperado !== encontrado)
    .sort(
      (a, b) =>
        a.referencia.cd_cargo_pergunta - b.referencia.cd_cargo_pergunta ||
        a.referencia.cd_tipo_votavel - b.referencia.cd_tipo_votavel ||
        (a.referencia.nr_votavel ?? -1) - (b.referencia.nr_votavel ?? -1),
    );
}

function noEscopo(voto) {
  return voto.cd_cargo_pergunta === 1 || voto.cd_cargo_pergunta === 3;
}

export function conferirBuRdv({ buVotos, rdvVotos, sgUf, cdMunicipioTse, nrZona, nrSecao }) {
  return compararVotos({
    esperados: buVotos.filter(noEscopo),
    encontrados: rdvVotos.filter(noEscopo),
  }).map(
    ({ referencia, esperado, encontrado }) => ({
      fonte: 'rdv',
      campo: 'votos',
      sg_uf: sgUf,
      cd_municipio_tse: cdMunicipioTse,
      nr_zona: nrZona,
      nr_secao: nrSecao,
      cd_cargo_pergunta: referencia.cd_cargo_pergunta,
      nr_votavel: referencia.nr_votavel,
      valor_esperado: String(esperado),
      valor_encontrado: String(encontrado),
    }),
  );
}
