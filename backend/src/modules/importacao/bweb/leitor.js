import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { PassThrough, Transform } from 'node:stream';
import { createGunzip } from 'node:zlib';

const CODIGOS_GZIP = new Set(['Z_DATA_ERROR', 'Z_BUF_ERROR', 'Z_NEED_DICT']);

export function ehGzip(caminho) {
  return /\.gz$/i.test(String(caminho ?? ''));
}

export function eh7z(caminho) {
  return /\.7z$/i.test(String(caminho ?? ''));
}

function abrir7z(caminho) {
  const processo = spawn('7z', ['x', '-so', '-y', caminho], { stdio: ['ignore', 'pipe', 'pipe'] });
  const saida = new PassThrough();
  let erro = '';

  processo.stderr.on('data', (bloco) => {
    erro += bloco.toString('latin1');
  });
  processo.on('error', (falha) => {
    saida.destroy(
      falha.code === 'ENOENT'
        ? new Error('binário 7z não encontrado: instale o p7zip ou converta o arquivo para .csv/.csv.gz')
        : falha,
    );
  });
  processo.on('close', (codigo) => {
    if (codigo !== 0) saida.destroy(new Error(`7z falhou ao ler ${caminho}: ${erro.trim()}`));
  });
  processo.stdout.pipe(saida);

  return saida;
}

// Some TSE files carry ~900 MB runs of NUL bytes with no newline; readline would
// buffer them as one line and exceed V8's max string length.
function removerNulos() {
  return new Transform({
    transform(pedaco, _codificacao, concluir) {
      concluir(null, pedaco.includes(0) ? pedaco.filter((byte) => byte !== 0) : pedaco);
    },
  });
}

function abrirFluxo(caminho) {
  const limpo = removerNulos();
  if (eh7z(caminho)) {
    const descompactado = abrir7z(caminho);
    descompactado.on('error', (erro) => limpo.destroy(erro));
    return descompactado.pipe(limpo);
  }

  const origem = createReadStream(caminho);
  if (!ehGzip(caminho)) {
    origem.on('error', (erro) => limpo.destroy(erro));
    return origem.pipe(limpo);
  }

  const descompactado = createGunzip();
  origem.on('error', (erro) => descompactado.destroy(erro));
  descompactado.on('error', (erro) => limpo.destroy(erro));
  return origem.pipe(descompactado).pipe(limpo);
}

export function dividirLinhaBweb(linha) {
  const campos = [];
  let atual = '';
  let emAspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i];

    if (caractere === '"') {
      if (emAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        emAspas = !emAspas;
      }
      continue;
    }

    if (caractere === ';' && !emAspas) {
      campos.push(atual);
      atual = '';
      continue;
    }

    atual += caractere;
  }

  campos.push(atual);
  return campos;
}

export async function* lerLinhas(caminho) {
  const fluxo = abrirFluxo(caminho).setEncoding('latin1');
  const leitor = createInterface({ input: fluxo, crlfDelay: Infinity });
  let nrLinha = 0;

  try {
    for await (const linha of leitor) {
      nrLinha += 1;
      yield { nrLinha, campos: dividirLinhaBweb(linha) };
    }
  } catch (erro) {
    if (ehGzip(caminho) && CODIGOS_GZIP.has(erro.code)) {
      const falha = new Error(
        `Não foi possível descomprimir ${caminho}: o arquivo .gz está corrompido ou truncado`,
      );
      falha.codigo = 'ARQUIVO_GZ_INVALIDO';
      falha.causa = erro;
      throw falha;
    }
    throw erro;
  } finally {
    leitor.close();
    fluxo.destroy();
  }
}

export async function lerPrimeiraLinha(caminho) {
  for await (const linha of lerLinhas(caminho)) {
    return linha;
  }
  return null;
}

export async function lerAmostra(caminho, tamanho = 4096) {
  const fluxo = abrirFluxo(caminho);
  const partes = [];
  let total = 0;

  try {
    for await (const bloco of fluxo) {
      partes.push(bloco);
      total += bloco.length;
      if (total >= tamanho) break;
    }
  } finally {
    fluxo.destroy();
  }

  return Buffer.concat(partes).subarray(0, tamanho);
}
