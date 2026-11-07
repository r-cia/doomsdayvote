import {
  BerError,
  CODIGO_ERRO_BER,
  filhos,
  ehContexto,
  ehUniversal,
  lerInteiroImplicito,
  lerTlv,
  TAG,
} from './ber.js';

const NUMERIC_STRING = 18;

// O RDV codifica o tipo de voto em outro domínio; a conversão replica os códigos do BU.
// Os códigos 4, 6 e 7 caem no tipo 3 do BU, que é o agregado sem número (o BU só numera os tipos 1 e 4).
const TIPO_VOTAVEL_BU = Object.freeze({
  1: 4,
  2: 1,
  3: 2,
  4: 3,
  6: 3,
  7: 3,
});

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

function lerNumero(buffer, tlv) {
  const texto = buffer.subarray(tlv.inicioValor, tlv.fimValor).toString('latin1');
  if (!/^\d+$/.test(texto)) throw invalido(tlv.inicio, 'número do voto não é numérico');
  return Number(texto);
}

function lerVoto(buffer, tlv) {
  exigirSequencia(tlv, 'voto');
  const campos = filhos(buffer, tlv);

  const tipoTlv = campos.find((item) => ehUniversal(item, TAG.ENUMERATED) && !item.construido);
  if (!tipoTlv) throw invalido(tlv.inicio, 'voto sem tipo');
  const codigo = lerInteiroImplicito(buffer, tipoTlv);
  const tipo = TIPO_VOTAVEL_BU[codigo];
  if (!tipo) throw invalido(tipoTlv.inicio, `tipo de voto desconhecido: ${codigo}`);

  const numeroTlv = campos.find((item) => ehUniversal(item, NUMERIC_STRING) && !item.construido);

  return {
    tipo,
    numero: numeroTlv ? lerNumero(buffer, numeroTlv) : null,
  };
}

function lerGrupo(buffer, tlv, votos) {
  exigirSequencia(tlv, 'grupo de votos');
  const campos = filhos(buffer, tlv);

  const cargoTlv = campos.find((item) => ehContexto(item, 1) && !item.construido);
  if (!cargoTlv) throw invalido(tlv.inicio, 'grupo sem cargo');
  const cargo = lerInteiroImplicito(buffer, cargoTlv);

  const listaTlv = campos.find((item) => ehUniversal(item, TAG.SEQUENCE) && item.construido);
  if (!listaTlv) throw invalido(tlv.inicio, 'grupo sem votos');

  for (const votoTlv of filhos(buffer, listaTlv)) {
    votos.push({ cargo, ...lerVoto(buffer, votoTlv) });
  }
}

function lerBloco(buffer, tlv, votos) {
  exigirSequencia(tlv, 'bloco de votos');
  const campos = filhos(buffer, tlv);
  const listaTlv = campos.find((item) => ehUniversal(item, TAG.SEQUENCE) && item.construido);
  if (!listaTlv) throw invalido(tlv.inicio, 'bloco sem grupos');
  for (const grupoTlv of filhos(buffer, listaTlv)) lerGrupo(buffer, grupoTlv, votos);
}

function agregar(votos) {
  const porChave = new Map();
  for (const voto of votos) {
    const chave = `${voto.cargo}:${voto.tipo}:${voto.numero ?? 'nulo'}`;
    const acumulado = porChave.get(chave);
    if (acumulado) acumulado.quantidade += 1;
    else porChave.set(chave, { ...voto, quantidade: 1 });
  }
  return [...porChave.values()].sort(
    (a, b) => a.cargo - b.cargo || a.tipo - b.tipo || (a.numero ?? -1) - (b.numero ?? -1),
  );
}

function localizarEleicoes(conteudo, itens) {
  const rdv = procurar(conteudo, itens, (item) => {
    if (!ehUniversal(item, TAG.SEQUENCE) || !item.construido) return false;
    const campos = filhos(conteudo, item);
    return (
      campos.length >= 4 &&
      ehUniversal(campos[0], TAG.INTEGER) &&
      ehUniversal(campos[1], TAG.ENUMERATED) &&
      ehUniversal(campos[2], TAG.SEQUENCE)
    );
  });
  if (!rdv) {
    return procurar(conteudo, itens, (item) => ehContexto(item, 1) && item.construido);
  }

  const campos = filhos(conteudo, rdv);
  return (
    campos.find((item) => ehContexto(item, 0) && item.construido) ??
    campos.find((item) => ehContexto(item, 1) && item.construido) ??
    procurar(conteudo, itens, (item) => ehContexto(item, 1) && item.construido)
  );
}

export function decodificarRdv(conteudo) {
  if (!Buffer.isBuffer(conteudo)) throw new TypeError('conteudo deve ser Buffer');
  const raiz = lerTlv(conteudo, 0);
  exigirSequencia(raiz, 'arquivo');
  const itens = filhos(conteudo, raiz);
  if (itens.length < 2) throw invalido(raiz.inicio, 'arquivo sem cabeçalho e votos');

  const votosTlv = localizarEleicoes(conteudo, itens);
  if (!votosTlv) throw invalido(raiz.inicio, 'arquivo sem registro de votos');

  const votos = [];
  for (const blocoTlv of filhos(conteudo, votosTlv)) lerBloco(conteudo, blocoTlv, votos);
  if (votos.length === 0) throw invalido(votosTlv.inicio, 'arquivo sem votos');

  return agregar(votos);
}
