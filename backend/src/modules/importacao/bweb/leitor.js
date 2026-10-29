import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

const CODIGOS_GZIP = new Set(['Z_DATA_ERROR', 'Z_BUF_ERROR', 'Z_NEED_DICT']);

export function ehGzip(caminho) {
  return /\.gz$/i.test(String(caminho ?? ''));
}

function abrirFluxo(caminho) {
  const origem = createReadStream(caminho);
  if (!ehGzip(caminho)) return origem;

  const descompactado = createGunzip();
  origem.on('error', (erro) => descompactado.destroy(erro));
  return origem.pipe(descompactado);
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
