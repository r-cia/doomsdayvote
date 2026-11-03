import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { crc32, inflateRawSync } from 'node:zlib';

export const CODIGO_ERRO_ZIP = Object.freeze({
  CRC: 'CRC_DIVERGENTE',
});

export class ZipError extends Error {
  constructor(codigo, mensagem) {
    super(mensagem);
    this.name = 'ZipError';
    this.codigo = codigo;
  }
}

const executar = promisify(execFile);
const MAX_BUFFER_LISTAGEM = 64 * 1024 * 1024;
const MAX_BUFFER_EXTRACAO = 256 * 1024 * 1024;
const MAGIC = Object.freeze({
  zip: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  '7z': Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
});

async function executar7z(argumentos, opcoes) {
  try {
    return await executar('7z', argumentos, opcoes);
  } catch (erro) {
    if (erro.code === 'ENOENT') {
      throw new Error(
        'binário 7z não encontrado: instale o p7zip ou converta o arquivo para .zip',
      );
    }
    const detalhe = Buffer.isBuffer(erro.stderr) ? erro.stderr.toString('utf8') : erro.stderr;
    throw new Error(`7z falhou: ${(detalhe ?? '').trim() || erro.message}`);
  }
}

export function detectarFormato(conteudo) {
  if (conteudo.subarray(0, MAGIC.zip.length).equals(MAGIC.zip)) return 'zip';
  if (conteudo.subarray(0, MAGIC['7z'].length).equals(MAGIC['7z'])) return '7z';
  throw new Error('formato de arquivo não suportado: esperado zip ou 7z');
}

function lerPropriedades(bloco) {
  const propriedades = {};
  for (const linha of bloco.split('\n')) {
    const achado = /^(.+?) = (.*)$/.exec(linha);
    if (achado) propriedades[achado[1]] = achado[2];
  }
  return propriedades;
}

export async function listarEntradas7z(caminho) {
  const { stdout } = await executar7z(['l', '-slt', caminho], {
    maxBuffer: MAX_BUFFER_LISTAGEM,
    encoding: 'utf8',
  });

  const entradas = [];
  for (const bloco of stdout.split(/\r?\n\r?\n/)) {
    const propriedades = lerPropriedades(bloco);
    if (!propriedades.Path || propriedades.Type || propriedades['Physical Size']) continue;
    if (propriedades.Folder === '+') continue;
    entradas.push({
      nome: propriedades.Path,
      metodo: propriedades.Method === 'Copy' ? 0 : 8,
      tamanhoComprimido: Number(propriedades['Packed Size'] ?? 0),
    });
  }

  return entradas;
}

export async function extrairEntrada7z(caminho, nome) {
  const { stdout } = await executar7z(['x', '-so', '-y', caminho, nome], {
    maxBuffer: MAX_BUFFER_EXTRACAO,
    encoding: 'buffer',
  });
  return stdout;
}

export function listarEntradas(conteudo, contexto = 'log.jez') {
  const eocd = conteudo.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error(`${contexto} sem diretório central`);

  const total = conteudo.readUInt16LE(eocd + 10);
  let offset = conteudo.readUInt32LE(eocd + 16);
  const entradas = [];

  for (let indice = 0; indice < total; indice += 1) {
    if (conteudo.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('entrada do diretório central inválida');
    }
    const tamanhoNome = conteudo.readUInt16LE(offset + 28);
    const tamanhoExtra = conteudo.readUInt16LE(offset + 30);
    const tamanhoComentario = conteudo.readUInt16LE(offset + 32);
    entradas.push({
      nome: conteudo.subarray(offset + 46, offset + 46 + tamanhoNome).toString('latin1'),
      metodo: conteudo.readUInt16LE(offset + 10),
      sinalizadores: conteudo.readUInt16LE(offset + 8),
      crc: conteudo.readUInt32LE(offset + 16),
      tamanhoComprimido: conteudo.readUInt32LE(offset + 20),
      inicioLocal: conteudo.readUInt32LE(offset + 42),
    });
    offset += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  return entradas;
}

export function extrairEntrada(conteudo, entrada, contexto = 'log.jez') {
  if (entrada.sinalizadores & 1) throw new Error(`entrada do ${contexto} criptografada`);
  if (conteudo.readUInt32LE(entrada.inicioLocal) !== 0x04034b50) {
    throw new Error(`cabeçalho local do ${contexto} inválido`);
  }

  const tamanhoNome = conteudo.readUInt16LE(entrada.inicioLocal + 26);
  const tamanhoExtra = conteudo.readUInt16LE(entrada.inicioLocal + 28);
  const inicio = entrada.inicioLocal + 30 + tamanhoNome + tamanhoExtra;
  const dados = conteudo.subarray(inicio, inicio + entrada.tamanhoComprimido);

  let saida;
  if (entrada.metodo === 0) saida = Buffer.from(dados);
  else if (entrada.metodo === 8) saida = inflateRawSync(dados);
  else throw new Error(`método de compressão do ${contexto} não suportado: ${entrada.metodo}`);

  if (entrada.crc !== undefined && crc32(saida) !== entrada.crc) {
    throw new ZipError(
      CODIGO_ERRO_ZIP.CRC,
      `CRC32 divergente na entrada ${entrada.nome} do ${contexto}`,
    );
  }

  return saida;
}
