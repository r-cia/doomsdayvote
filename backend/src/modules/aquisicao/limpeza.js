import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createGzip } from 'node:zlib';

const executar = promisify(execFile);

export const SUFIXOS_INUTEIS_BU = Object.freeze([
  '*.vsc',
  '*.vscmr',
  '*.vscsa',
  '*.pdf',
  '*.id',
  '*-imgbu.dat',
  '*-imgbusa.dat',
  '*-busa.dat',
  '*-logsa.jez',
  '*.imgbu',
  '*.imgbusa',
  '*.logsajez',
  '*.busa',
]);

export const PADRAO_MANTIDOS_BU = /-(bu|rdv)\.dat$|-log\.jez$|\.(bu|rdv|logjez)$/;

export async function listarEntradas(caminho) {
  const { stdout } = await executar('unzip', ['-Z1', caminho], { maxBuffer: 256 * 1024 * 1024 });
  return stdout.split('\n').filter(Boolean);
}

export async function limparZipBu(caminho) {
  await executar('zip', ['-d', caminho, ...SUFIXOS_INUTEIS_BU], { maxBuffer: 256 * 1024 * 1024 });

  const entradas = await listarEntradas(caminho);
  const foraDoPadrao = entradas.filter((nome) => !PADRAO_MANTIDOS_BU.test(nome));
  if (foraDoPadrao.length > 0) {
    throw new Error(`entradas fora do padrão após limpeza: ${foraDoPadrao.slice(0, 3).join(', ')}`);
  }

  const { stdout } = await executar('unzip', ['-t', caminho], {
    maxBuffer: 512 * 1024 * 1024,
  }).catch((erro) => ({ stdout: erro.stdout ?? '' }));
  if (!String(stdout).includes('No errors detected')) {
    throw new Error(`zip com erro de CRC após limpeza: ${caminho}`);
  }

  return { entradas: entradas.length };
}

function escolherEntrada(entradas) {
  return entradas.find((nome) => /\.csv$/i.test(nome)) ?? entradas.find((nome) => /\.txt$/i.test(nome));
}

export async function converterBwebParaGzip(origem, destino) {
  const ehZip = /\.zip$/i.test(origem);

  if (!ehZip) {
    await pipeline(createReadStream(origem), createGzip(), createWriteStream(destino));
  } else {
    const entradas = await listarEntradas(origem);
    const entrada = escolherEntrada(entradas);
    if (!entrada) throw new Error(`zip sem csv/txt: ${origem}`);

    const descompactador = spawn('unzip', ['-p', origem, entrada], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let erro = '';
    descompactador.stderr.setEncoding('utf8');
    descompactador.stderr.on('data', (texto) => {
      erro += texto;
    });
    const encerrado = new Promise((resolver) => descompactador.on('close', resolver));

    await pipeline(descompactador.stdout, createGzip(), createWriteStream(destino));
    const codigo = await encerrado;
    if (codigo !== 0) throw new Error(`unzip falhou em ${origem}: ${erro.trim()}`);
  }

  const { size } = await stat(destino);
  if (size === 0) throw new Error(`arquivo convertido vazio: ${destino}`);
  return { caminho: destino, bytes: size };
}
