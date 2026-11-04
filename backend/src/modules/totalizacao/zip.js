import { execFile, spawn } from 'node:child_process';
import { open } from 'node:fs/promises';
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
const MAX_ERRO_7Z = 64 * 1024;
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

export async function detectarFormatoArquivo(caminho) {
  const arquivo = await open(caminho, 'r');
  try {
    const cabecalho = Buffer.alloc(MAGIC['7z'].length);
    const { bytesRead } = await arquivo.read(cabecalho, 0, cabecalho.length, 0);
    return detectarFormato(cabecalho.subarray(0, bytesRead));
  } finally {
    await arquivo.close();
  }
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
      tamanho: Number(propriedades.Size ?? 0),
      tamanhoComprimido: Number(propriedades['Packed Size'] ?? 0),
    });
  }

  return entradas;
}

export async function* lerEntradas7z(caminho, entradas) {
  if (entradas.length === 0) return;

  const limites = [];
  let acumulado = 0;
  for (const entrada of entradas) {
    acumulado += entrada.tamanho;
    limites.push(acumulado);
  }

  const filho = spawn('7z', ['x', '-so', '-y', caminho], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let erro = '';
  filho.stderr.setEncoding('utf8');
  filho.stderr.on('data', (texto) => {
    if (erro.length < MAX_ERRO_7Z) erro += texto;
  });
  const encerrado = new Promise((resolver) => filho.on('close', resolver));

  try {
    let indice = 0;
    let posicao = 0;
    let pedacos = [];

    for await (const pedaco of filho.stdout) {
      let deslocamento = 0;
      while (deslocamento < pedaco.length) {
        if (indice >= entradas.length) {
          throw new Error(`7z devolveu mais dados que as entradas listadas: ${caminho}`);
        }
        const limite = limites[indice];
        const quantidade = Math.min(limite - posicao, pedaco.length - deslocamento);
        pedacos.push(pedaco.subarray(deslocamento, deslocamento + quantidade));
        posicao += quantidade;
        deslocamento += quantidade;

        if (posicao === limite) {
          yield { entrada: entradas[indice], conteudo: Buffer.concat(pedacos) };
          indice += 1;
          pedacos = [];
          while (indice < entradas.length && limites[indice] === posicao) {
            yield { entrada: entradas[indice], conteudo: Buffer.alloc(0) };
            indice += 1;
          }
        }
      }
    }

    const codigo = await encerrado;
    if (codigo !== 0) {
      throw new Error(`7z falhou: ${erro.trim() || `código ${codigo}`}`);
    }
    if (indice !== entradas.length) {
      throw new Error(`7z devolveu menos dados que as entradas listadas: ${caminho}`);
    }
  } finally {
    filho.stdout.destroy();
    if (filho.exitCode === null && filho.signalCode === null) filho.kill();
  }
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
