import {
  BerError,
  CODIGO_ERRO_BER,
  filhos,
  ehContexto,
  ehUniversal,
  lerGeneralString,
  lerInteiro,
  lerInteiroImplicito,
  lerOctetString,
  lerTlv,
  TAG,
} from './ber.js';

function invalido(offset, mensagem) {
  return new BerError(CODIGO_ERRO_BER.INVALIDO, mensagem, offset);
}

function exigirSequencia(tlv, contexto) {
  if (!ehUniversal(tlv, TAG.SEQUENCE) || !tlv.construido) {
    throw invalido(tlv.inicio, `${contexto}: SEQUENCE esperada`);
  }
}

function procurar(buffer, itens, predicado) {
  for (const item of itens) {
    if (predicado(item)) return item;
    if (item.construido) {
      const achado = procurar(buffer, filhos(buffer, item), predicado);
      if (achado) return achado;
    }
  }
  return null;
}

function lerDataHora(buffer, tlv, contexto) {
  exigirSequencia(tlv, contexto);
  const itens = filhos(buffer, tlv);
  const texto = itens.find((item) => ehUniversal(item, TAG.GENERAL_STRING));
  if (!texto) throw invalido(tlv.inicio, `${contexto}: GENERALSTRING esperada`);
  return lerGeneralString(buffer, texto);
}

function decodificarLocalidade(buffer, itens) {
  const localizacaoTlv = itens.find((item) => {
    if (!ehUniversal(item, TAG.SEQUENCE) || !item.construido) return false;
    const campos = filhos(buffer, item);
    return (
      campos.length === 3 &&
      ehUniversal(campos[0], TAG.SEQUENCE) &&
      ehUniversal(campos[1], TAG.INTEGER) &&
      ehUniversal(campos[2], TAG.INTEGER)
    );
  });
  if (!localizacaoTlv) throw invalido(0, 'BU sem local e seção');

  const camposLocalizacao = filhos(buffer, localizacaoTlv);
  const coordenadas = filhos(buffer, camposLocalizacao[0]);
  if (coordenadas.length !== 2) throw invalido(camposLocalizacao[0].inicio, 'município e zona esperados');

  const urnaTlv = procurar(buffer, itens, (item) => {
    if (!ehUniversal(item, TAG.SEQUENCE) || !item.construido) return false;
    const campos = filhos(buffer, item);
    return (
      campos.length >= 3 &&
      ehUniversal(campos[0], TAG.INTEGER) &&
      ehUniversal(campos[1], TAG.OCTET_STRING) &&
      (ehUniversal(campos[2], TAG.SEQUENCE) || ehUniversal(campos[2], TAG.GENERAL_STRING))
    );
  });
  if (!urnaTlv) throw invalido(0, 'BU sem urna');

  return {
    municipio: lerInteiro(buffer, coordenadas[0]),
    zona: lerInteiro(buffer, coordenadas[1]),
    local: lerInteiro(buffer, camposLocalizacao[1]),
    secao: lerInteiro(buffer, camposLocalizacao[2]),
    urna: lerInteiro(buffer, filhos(buffer, urnaTlv)[0]),
  };
}

function decodificarVotavel(buffer, tlv) {
  exigirSequencia(tlv, 'votável');
  const campos = filhos(buffer, tlv);

  const tipoTlv = campos.find((item) => ehContexto(item, 1) && !item.construido);
  const quantidadeTlv = campos.find((item) => ehContexto(item, 2) && !item.construido);
  if (!tipoTlv) throw invalido(tlv.inicio, 'votável sem tipo');
  if (!quantidadeTlv) throw invalido(tlv.inicio, 'votável sem quantidade');

  const numeroTlv = campos.find((item) => ehContexto(item, 3));
  let numero = null;
  if (numeroTlv) {
    const internos = filhos(buffer, numeroTlv).filter((item) => ehUniversal(item, TAG.INTEGER));
    if (internos.length === 0) throw invalido(numeroTlv.inicio, 'votável sem número');
    numero = lerInteiro(buffer, internos[internos.length - 1]);
  }

  const assinatura = campos.find((item) => ehUniversal(item, TAG.OCTET_STRING) && !item.construido);
  if (!assinatura) throw invalido(tlv.inicio, 'votável sem assinatura');
  if (assinatura.fimValor - assinatura.inicioValor !== 64) {
    throw invalido(assinatura.inicio, 'assinatura do votável fora dos 64 bytes esperados');
  }

  return {
    tipo: lerInteiroImplicito(buffer, tipoTlv),
    quantidade: lerInteiroImplicito(buffer, quantidadeTlv),
    numero,
  };
}

function ehVotavel(buffer, tlv) {
  if (!ehUniversal(tlv, TAG.SEQUENCE) || !tlv.construido) return false;
  const campos = filhos(buffer, tlv);
  const assinatura = campos.find(
    (item) => ehUniversal(item, TAG.OCTET_STRING) && !item.construido,
  );
  return (
    campos.some((item) => ehContexto(item, 1) && !item.construido) &&
    campos.some((item) => ehContexto(item, 2) && !item.construido) &&
    assinatura !== undefined &&
    assinatura.fimValor - assinatura.inicioValor === 64
  );
}

function ehNoCargo(buffer, tlv) {
  if (!ehUniversal(tlv, TAG.SEQUENCE) || !tlv.construido) return false;
  const campos = filhos(buffer, tlv);
  if (!campos[0] || !ehContexto(campos[0], 1) || campos[0].construido) return false;
  const listaTlv = campos.find((item) => ehUniversal(item, TAG.SEQUENCE) && item.construido);
  if (!listaTlv) return false;
  return filhos(buffer, listaTlv).some((item) => ehVotavel(buffer, item));
}

function ehCabecalhoCargo(buffer, tlv) {
  if (!ehUniversal(tlv, TAG.SEQUENCE) || !tlv.construido) return false;
  const campos = filhos(buffer, tlv);
  const leiaute2026 =
    campos.length >= 5 &&
    ehUniversal(campos[0], TAG.INTEGER) &&
    ehUniversal(campos[1], TAG.INTEGER) &&
    ehUniversal(campos[2], TAG.INTEGER) &&
    ehUniversal(campos[3], TAG.INTEGER);
  const leiaute2022 =
    campos.length === 3 &&
    ehUniversal(campos[0], TAG.INTEGER) &&
    ehUniversal(campos[1], TAG.INTEGER) &&
    ehUniversal(campos[2], TAG.SEQUENCE);
  return leiaute2026 || leiaute2022;
}

function ehGrupo(buffer, tlv) {
  if (!ehUniversal(tlv, TAG.SEQUENCE) || !tlv.construido) return false;
  const campos = filhos(buffer, tlv);
  return (
    campos.length >= 3 &&
    ehUniversal(campos[0], TAG.ENUMERATED) &&
    ehUniversal(campos[1], TAG.INTEGER) &&
    ehUniversal(campos[2], TAG.SEQUENCE)
  );
}

function agregarVotaveis(votaveis) {
  const porChave = new Map();
  for (const votavel of votaveis) {
    const chave = `${votavel.tipo}:${votavel.numero ?? 'nulo'}`;
    const acumulado = porChave.get(chave);
    if (acumulado) acumulado.quantidade += votavel.quantidade;
    else porChave.set(chave, { ...votavel });
  }
  return [...porChave.values()].sort(
    (a, b) => a.tipo - b.tipo || (a.numero ?? -1) - (b.numero ?? -1),
  );
}

function coletarCargos(buffer, tlv, contexto, cargos) {
  if (ehVotavel(buffer, tlv)) return;
  const campos = filhos(buffer, tlv);

  if (ehNoCargo(buffer, tlv)) {
    if (contexto.aptos === null || contexto.comparecimento === null) {
      throw invalido(tlv.inicio, 'cargo sem aptos ou comparecimento');
    }
    const identificador = lerInteiroImplicito(buffer, campos[0]);
    const listaTlv = campos.find((item) => ehUniversal(item, TAG.SEQUENCE) && item.construido);
    const votaveis = filhos(buffer, listaTlv).map((item) => decodificarVotavel(buffer, item));
    cargos.push({
      identificador,
      aptos: contexto.aptos,
      comparecimento: contexto.comparecimento,
      votaveis: agregarVotaveis(votaveis),
    });
    return;
  }

  let proximo = contexto;
  if (ehCabecalhoCargo(buffer, tlv)) {
    proximo = { ...contexto, aptos: lerInteiro(buffer, campos[1]) };
  } else if (ehGrupo(buffer, tlv)) {
    proximo = { ...contexto, comparecimento: lerInteiro(buffer, campos[1]) };
  }

  for (const campo of campos) {
    if (campo.construido) coletarCargos(buffer, campo, proximo, cargos);
  }
}

function decodificarConteudoBu(buffer) {
  const raiz = lerTlv(buffer, 0);
  exigirSequencia(raiz, 'BU');
  const itens = filhos(buffer, raiz);
  if (itens.length < 6) throw invalido(raiz.inicio, 'BU incompleto');

  const dataHora = lerDataHora(buffer, itens[0], 'data/hora do BU');

  const localidade = decodificarLocalidade(buffer, itens);

  const aberturaTlv = itens.find((item) => ehContexto(item, 0) && item.construido);
  if (!aberturaTlv) throw invalido(raiz.inicio, 'BU sem abertura e encerramento');
  const instantes = filhos(buffer, aberturaTlv);
  if (instantes.length !== 2) throw invalido(aberturaTlv.inicio, 'abertura e encerramento esperados');
  const abertura = lerGeneralString(buffer, instantes[0]);
  const encerramento = lerGeneralString(buffer, instantes[1]);

  const indiceAbertura = itens.indexOf(aberturaTlv);
  const libCodigoTlv = itens.find((item) => ehContexto(item, 1) && !item.construido);
  const compBiometricoTlv = itens.find((item) => ehContexto(item, 2) && !item.construido);
  const cargos2022Tlv = itens.find((item) => ehContexto(item, 3) && item.construido);
  const leiaute2022 = Boolean(libCodigoTlv || compBiometricoTlv || cargos2022Tlv);

  let comparecimento;
  let habilitacao1;
  let habilitacao2;
  let habilitacao3;
  let cargosTlv;

  if (leiaute2022) {
    cargosTlv = itens.find((item) => ehContexto(item, 3) && item.construido);
    habilitacao1 = libCodigoTlv ? lerInteiroImplicito(buffer, libCodigoTlv) : null;
    habilitacao2 = compBiometricoTlv ? lerInteiroImplicito(buffer, compBiometricoTlv) : null;
    habilitacao3 = null;
  } else {
    const comparecimentoTlv = itens[indiceAbertura + 1];
    if (!comparecimentoTlv) throw invalido(raiz.inicio, 'BU sem comparecimento');
    comparecimento = lerInteiro(buffer, comparecimentoTlv);

    const habilitacaoTlv = itens.find((item) => ehContexto(item, 1) && item.construido);
    const habilitacoes = habilitacaoTlv ? filhos(buffer, habilitacaoTlv) : null;
    if (habilitacoes && habilitacoes.length !== 3) {
      throw invalido(habilitacaoTlv.inicio, 'três habilitações esperadas');
    }

    const indiceCargos = habilitacaoTlv
      ? itens.indexOf(habilitacaoTlv)
      : itens.indexOf(comparecimentoTlv);
    cargosTlv = itens[indiceCargos + 1];

    habilitacao1 = habilitacoes ? lerInteiro(buffer, habilitacoes[0]) : null;
    habilitacao2 = habilitacoes ? lerInteiro(buffer, habilitacoes[1]) : null;
    habilitacao3 = habilitacoes ? lerInteiro(buffer, habilitacoes[2]) : null;
  }

  if (!cargosTlv) throw invalido(raiz.inicio, 'BU sem cargos');
  if (leiaute2022) {
    if (!cargosTlv.construido) throw invalido(cargosTlv.inicio, 'cargos: SEQUENCE esperada');
  } else {
    exigirSequencia(cargosTlv, 'cargos');
  }
  const cargos = [];
  coletarCargos(buffer, cargosTlv, { aptos: null, comparecimento: null }, cargos);
  if (cargos.length === 0) throw invalido(cargosTlv.inicio, 'BU sem cargos decodificáveis');
  cargos.sort((a, b) => a.identificador - b.identificador);

  if (leiaute2022) comparecimento = cargos[0].comparecimento;
  if (comparecimento === null || comparecimento === undefined) {
    throw invalido(cargosTlv.inicio, 'BU sem comparecimento');
  }

  return {
    dataHora,
    abertura,
    encerramento,
    comparecimento,
    habilitacao1,
    habilitacao2,
    habilitacao3,
    urna: localidade.urna,
    localidade: {
      municipio: localidade.municipio,
      zona: localidade.zona,
      local: localidade.local,
      secao: localidade.secao,
    },
    cargos,
  };
}

export function decodificarBu(conteudo) {
  if (!Buffer.isBuffer(conteudo)) throw new TypeError('conteudo deve ser Buffer');
  const raiz = lerTlv(conteudo, 0);
  exigirSequencia(raiz, 'arquivo');
  const itens = filhos(conteudo, raiz);
  if (itens.length < 2) throw invalido(raiz.inicio, 'arquivo sem cabeçalho e BU');

  const dataHoraArquivo = lerDataHora(conteudo, itens[0], 'cabeçalho do arquivo');
  const octetos = itens.filter(
    (item) => ehUniversal(item, TAG.OCTET_STRING) && !item.construido,
  );
  if (octetos.length !== 1) {
    throw invalido(raiz.inicio, 'arquivo deve conter um único OCTET STRING com o BU');
  }
  const buConteudo = lerOctetString(conteudo, octetos[0]);

  return { dataHoraArquivo, ...decodificarConteudoBu(buConteudo) };
}
