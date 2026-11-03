export const CODIGO_ERRO_BER = Object.freeze({
  TRUNCADO: 'TRUNCADO',
  INVALIDO: 'INVALIDO',
});

export const CLASSE = Object.freeze({
  UNIVERSAL: 0,
  CONTEXTO: 2,
});

export const TAG = Object.freeze({
  INTEGER: 2,
  OCTET_STRING: 4,
  ENUMERATED: 10,
  SEQUENCE: 16,
  GENERAL_STRING: 27,
});

export class BerError extends Error {
  constructor(codigo, mensagem, offset) {
    super(mensagem);
    this.name = 'BerError';
    this.codigo = codigo;
    this.offset = offset;
  }
}

function truncado(offset, mensagem) {
  return new BerError(CODIGO_ERRO_BER.TRUNCADO, mensagem, offset);
}

function invalido(offset, mensagem) {
  return new BerError(CODIGO_ERRO_BER.INVALIDO, mensagem, offset);
}

export function lerTlv(buffer, offset = 0) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer deve ser Buffer');
  if (offset < 0 || offset >= buffer.length) throw truncado(offset, 'tag ausente');

  const primeiro = buffer[offset];
  const classe = primeiro >> 6;
  const construido = (primeiro & 0x20) !== 0;
  const numero = primeiro & 0x1f;
  if (numero === 0x1f) throw invalido(offset, 'tag de número alto não suportada');

  let cursor = offset + 1;
  if (cursor >= buffer.length) throw truncado(cursor, 'comprimento ausente');

  const primeiroComprimento = buffer[cursor];
  cursor += 1;

  let comprimento;
  if (primeiroComprimento === 0x80) {
    throw invalido(offset, 'comprimento indefinido não suportado');
  }
  if (primeiroComprimento < 0x80) {
    comprimento = primeiroComprimento;
  } else {
    const octetos = primeiroComprimento & 0x7f;
    if (octetos === 0 || octetos > 6) throw invalido(offset, 'comprimento longo inválido');
    if (cursor + octetos > buffer.length) throw truncado(cursor, 'comprimento truncado');
    comprimento = 0;
    for (let indice = 0; indice < octetos; indice += 1) {
      comprimento = comprimento * 256 + buffer[cursor + indice];
    }
    cursor += octetos;
  }

  const inicioValor = cursor;
  const fimValor = inicioValor + comprimento;
  if (fimValor > buffer.length) throw truncado(offset, 'valor truncado');

  return {
    tag: primeiro,
    classe,
    construido,
    numero,
    inicio: offset,
    inicioValor,
    fimValor,
    fim: fimValor,
  };
}

export function filhos(buffer, tlv) {
  if (!tlv.construido) throw invalido(tlv.inicio, 'valor primitivo não tem filhos');
  const itens = [];
  let cursor = tlv.inicioValor;
  while (cursor < tlv.fimValor) {
    const item = lerTlv(buffer, cursor);
    if (item.fim > tlv.fimValor) throw truncado(cursor, 'elemento excede o contêiner');
    itens.push(item);
    cursor = item.fim;
  }
  return itens;
}

export function ehUniversal(tlv, tag) {
  return tlv.classe === CLASSE.UNIVERSAL && tlv.numero === tag;
}

export function ehContexto(tlv, numero) {
  return tlv.classe === CLASSE.CONTEXTO && tlv.numero === numero;
}

export function exigirUniversal(tlv, tag, contexto) {
  if (!ehUniversal(tlv, tag)) throw invalido(tlv.inicio, `${contexto}: tag universal ${tag} esperada`);
}

export function exigirContexto(tlv, numero, contexto) {
  if (!ehContexto(tlv, numero)) throw invalido(tlv.inicio, `${contexto}: tag de contexto [${numero}] esperada`);
}

export function lerInteiro(buffer, tlv) {
  exigirUniversal(tlv, TAG.INTEGER, 'INTEGER');
  if (tlv.construido) throw invalido(tlv.inicio, 'INTEGER não pode ser construído');
  return lerInteiroImplicito(buffer, tlv);
}

export function lerInteiroImplicito(buffer, tlv) {
  if (tlv.construido) throw invalido(tlv.inicio, 'INTEGER implícito não pode ser construído');
  const comprimento = tlv.fimValor - tlv.inicioValor;
  if (comprimento === 0) throw invalido(tlv.inicio, 'INTEGER vazio');
  if (comprimento > 6) throw invalido(tlv.inicio, 'INTEGER maior que 6 octetos');

  let valor = 0;
  for (let indice = 0; indice < comprimento; indice += 1) {
    valor = valor * 256 + buffer[tlv.inicioValor + indice];
  }
  if (buffer[tlv.inicioValor] & 0x80) valor -= 256 ** comprimento;
  return valor;
}

export function lerOctetString(buffer, tlv) {
  exigirUniversal(tlv, TAG.OCTET_STRING, 'OCTET STRING');
  if (tlv.construido) throw invalido(tlv.inicio, 'OCTET STRING construído não suportado');
  return buffer.subarray(tlv.inicioValor, tlv.fimValor);
}

export function lerGeneralString(buffer, tlv) {
  exigirUniversal(tlv, TAG.GENERAL_STRING, 'GENERALSTRING');
  if (tlv.construido) throw invalido(tlv.inicio, 'GENERALSTRING não pode ser construído');
  return buffer.subarray(tlv.inicioValor, tlv.fimValor).toString('latin1');
}
