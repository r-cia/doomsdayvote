import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

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
  const stream = createReadStream(caminho, { encoding: 'latin1' });
  const leitor = createInterface({ input: stream, crlfDelay: Infinity });
  let nrLinha = 0;

  try {
    for await (const linha of leitor) {
      nrLinha += 1;
      yield { nrLinha, campos: dividirLinhaBweb(linha) };
    }
  } finally {
    leitor.close();
    stream.destroy();
  }
}

export async function lerPrimeiraLinha(caminho) {
  for await (const linha of lerLinhas(caminho)) {
    return linha;
  }
  return null;
}
