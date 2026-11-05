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
const ASSINATURA_ZIP = Object.freeze({
  local: 0x04034b50,
  central: 0x02014b50,
  eocd: 0x06054b50,
  eocd64: 0x06064b50,
  localizadorEocd64: 0x07064b50,
  campoZip64: 0x0001,
});
const ASSINATURA_EOCD = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const SENTINELA_16 = 0xffff;
const SENTINELA_32 = 0xffffffff;
const TAMANHO_EOCD64 = 56;
const TAMANHO_LOCALIZADOR_EOCD64 = 20;
const TAMANHO_CAUDA_ZIP = 66 * 1024;
const TAMANHO_MAX_DIRETORIO = 64 * 1024 * 1024;

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

function lerExtraZip64(extra) {
  let deslocamento = 0;
  while (deslocamento + 4 <= extra.length) {
    const id = extra.readUInt16LE(deslocamento);
    const tamanho = extra.readUInt16LE(deslocamento + 2);
    const inicio = deslocamento + 4;
    if (inicio + tamanho > extra.length) return null;
    if (id === ASSINATURA_ZIP.campoZip64) return extra.subarray(inicio, inicio + tamanho);
    deslocamento = inicio + tamanho;
  }
  return null;
}

function lerEntradasDiretorio(diretorio, total, contexto) {
  const entradas = [];
  let offset = 0;

  for (let indice = 0; indice < total; indice += 1) {
    if (
      offset + 46 > diretorio.length ||
      diretorio.readUInt32LE(offset) !== ASSINATURA_ZIP.central
    ) {
      throw new Error(`entrada do diretório central do ${contexto} inválida`);
    }
    const tamanhoNome = diretorio.readUInt16LE(offset + 28);
    const tamanhoExtra = diretorio.readUInt16LE(offset + 30);
    const tamanhoComentario = diretorio.readUInt16LE(offset + 32);
    const nome = diretorio.subarray(offset + 46, offset + 46 + tamanhoNome).toString('latin1');
    const metodo = diretorio.readUInt16LE(offset + 10);
    const sinalizadores = diretorio.readUInt16LE(offset + 8);
    const crc = diretorio.readUInt32LE(offset + 16);
    let tamanhoComprimido = diretorio.readUInt32LE(offset + 20);
    let tamanho = diretorio.readUInt32LE(offset + 24);
    let inicioLocal = diretorio.readUInt32LE(offset + 42);

    if (
      tamanhoComprimido === SENTINELA_32 ||
      tamanho === SENTINELA_32 ||
      inicioLocal === SENTINELA_32
    ) {
      const inicioExtra = offset + 46 + tamanhoNome;
      const zip64 = lerExtraZip64(diretorio.subarray(inicioExtra, inicioExtra + tamanhoExtra));
      if (!zip64) throw new Error(`entrada ${nome} do ${contexto} ZIP64 sem campo extra`);
      let posicao = 0;
      if (tamanho === SENTINELA_32) {
        tamanho = Number(zip64.readBigUInt64LE(posicao));
        posicao += 8;
      }
      if (tamanhoComprimido === SENTINELA_32) {
        tamanhoComprimido = Number(zip64.readBigUInt64LE(posicao));
        posicao += 8;
      }
      if (inicioLocal === SENTINELA_32) inicioLocal = Number(zip64.readBigUInt64LE(posicao));
    }

    entradas.push({ nome, metodo, sinalizadores, crc, tamanho, tamanhoComprimido, inicioLocal });
    offset += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  return entradas;
}

function descomprimir(dados, entrada, contexto) {
  if (entrada.sinalizadores & 1) throw new Error(`entrada do ${contexto} criptografada`);

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

export function listarEntradas(conteudo, contexto = 'log.jez') {
  const eocd = conteudo.lastIndexOf(ASSINATURA_EOCD);
  if (eocd < 0) throw new Error(`${contexto} sem diretório central`);

  const total = conteudo.readUInt16LE(eocd + 10);
  const tamanhoDiretorio = conteudo.readUInt32LE(eocd + 12);
  const inicioDiretorio = conteudo.readUInt32LE(eocd + 16);
  if (
    total === SENTINELA_16 ||
    tamanhoDiretorio === SENTINELA_32 ||
    inicioDiretorio === SENTINELA_32
  ) {
    throw new Error(`${contexto} ZIP64 não suportado na leitura em memória`);
  }

  const diretorio = conteudo.subarray(inicioDiretorio, inicioDiretorio + tamanhoDiretorio);
  return lerEntradasDiretorio(diretorio, total, contexto);
}

export function extrairEntrada(conteudo, entrada, contexto = 'log.jez') {
  if (conteudo.readUInt32LE(entrada.inicioLocal) !== ASSINATURA_ZIP.local) {
    throw new Error(`cabeçalho local do ${contexto} inválido`);
  }

  const tamanhoNome = conteudo.readUInt16LE(entrada.inicioLocal + 26);
  const tamanhoExtra = conteudo.readUInt16LE(entrada.inicioLocal + 28);
  const inicio = entrada.inicioLocal + 30 + tamanhoNome + tamanhoExtra;
  return descomprimir(
    conteudo.subarray(inicio, inicio + entrada.tamanhoComprimido),
    entrada,
    contexto,
  );
}

async function lerFaixa(arquivo, posicao, tamanho) {
  const buffer = Buffer.alloc(tamanho);
  let lidos = 0;

  while (lidos < tamanho) {
    const { bytesRead } = await arquivo.read(buffer, lidos, tamanho - lidos, posicao + lidos);
    if (bytesRead === 0) throw new Error('leitura do arquivo zip terminou antes do esperado');
    lidos += bytesRead;
  }

  return buffer;
}

async function lerEntradasDoArquivo(arquivo, tamanhoArquivo, contexto) {
  const tamanhoCauda = Math.min(tamanhoArquivo, TAMANHO_CAUDA_ZIP);
  const cauda = await lerFaixa(arquivo, tamanhoArquivo - tamanhoCauda, tamanhoCauda);
  const posicaoEocd = cauda.lastIndexOf(ASSINATURA_EOCD);
  if (posicaoEocd < 0) throw new Error(`${contexto} sem diretório central`);

  const eocdAbsoluto = tamanhoArquivo - tamanhoCauda + posicaoEocd;
  let total = cauda.readUInt16LE(posicaoEocd + 10);
  let tamanhoDiretorio = cauda.readUInt32LE(posicaoEocd + 12);
  let inicioDiretorio = cauda.readUInt32LE(posicaoEocd + 16);

  if (
    total === SENTINELA_16 ||
    tamanhoDiretorio === SENTINELA_32 ||
    inicioDiretorio === SENTINELA_32
  ) {
    const posicaoLocalizador = eocdAbsoluto - TAMANHO_LOCALIZADOR_EOCD64;
    if (posicaoLocalizador < 0) throw new Error(`${contexto} sem localizador ZIP64`);
    const localizador = await lerFaixa(arquivo, posicaoLocalizador, TAMANHO_LOCALIZADOR_EOCD64);
    if (localizador.readUInt32LE(0) !== ASSINATURA_ZIP.localizadorEocd64) {
      throw new Error(`${contexto} sem localizador ZIP64`);
    }

    const posicaoEocd64 = Number(localizador.readBigUInt64LE(8));
    const eocd64 = await lerFaixa(arquivo, posicaoEocd64, TAMANHO_EOCD64);
    if (eocd64.readUInt32LE(0) !== ASSINATURA_ZIP.eocd64) {
      throw new Error(`${contexto} com ZIP64 inválido`);
    }

    total = Number(eocd64.readBigUInt64LE(32));
    tamanhoDiretorio = Number(eocd64.readBigUInt64LE(40));
    inicioDiretorio = Number(eocd64.readBigUInt64LE(48));
  }

  if (tamanhoDiretorio > TAMANHO_MAX_DIRETORIO) {
    throw new Error(
      `${contexto} com diretório central acima do limite: ${tamanhoDiretorio} bytes`,
    );
  }
  if (total === 0 || tamanhoDiretorio === 0) return [];

  const diretorio = await lerFaixa(arquivo, inicioDiretorio, tamanhoDiretorio);
  return lerEntradasDiretorio(diretorio, total, contexto);
}

async function extrairEntradaArquivo(arquivo, entrada, contexto) {
  const cabecalho = await lerFaixa(arquivo, entrada.inicioLocal, 30);
  if (cabecalho.readUInt32LE(0) !== ASSINATURA_ZIP.local) {
    throw new Error(`cabeçalho local do ${contexto} inválido`);
  }

  const tamanhoNome = cabecalho.readUInt16LE(26);
  const tamanhoExtra = cabecalho.readUInt16LE(28);
  const inicio = entrada.inicioLocal + 30 + tamanhoNome + tamanhoExtra;
  const dados =
    entrada.tamanhoComprimido === 0
      ? Buffer.alloc(0)
      : await lerFaixa(arquivo, inicio, entrada.tamanhoComprimido);

  return descomprimir(dados, entrada, contexto);
}

export async function abrirZipArquivo(caminho, contexto = 'arquivo zip') {
  const arquivo = await open(caminho, 'r');
  try {
    const { size } = await arquivo.stat();
    const entradas = await lerEntradasDoArquivo(arquivo, size, contexto);
    return {
      entradas,
      extrair: (entrada) => extrairEntradaArquivo(arquivo, entrada, contexto),
      fechar: () => arquivo.close(),
    };
  } catch (erro) {
    await arquivo.close();
    throw erro;
  }
}
