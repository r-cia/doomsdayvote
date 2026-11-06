import { createWriteStream } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ESPERA_MS = 2000;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function baixarUma(url, parcial, timeoutMs) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!resposta.ok || !resposta.body) {
    throw new Error(`download ${url} respondeu ${resposta.status}`);
  }
  await pipeline(Readable.fromWeb(resposta.body), createWriteStream(parcial));
}

export async function baixar(url, destino, { tentativas = 3, timeoutMs = 600000 } = {}) {
  const parcial = `${destino}.part`;

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      await baixarUma(url, parcial, timeoutMs);
      const { size } = await stat(parcial);
      if (size === 0) throw new Error(`download vazio: ${url}`);
      await rename(parcial, destino);
      return { caminho: destino, bytes: size };
    } catch (erro) {
      await rm(parcial, { force: true });
      if (tentativa === tentativas) throw erro;
      await esperar(ESPERA_MS * tentativa);
    }
  }

  throw new Error(`download falhou: ${url}`);
}
