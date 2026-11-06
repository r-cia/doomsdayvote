import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { anosDisponiveis, filtrarRecursos, listarRecursos } from '../modules/aquisicao/tse.js';
import { baixar } from '../modules/aquisicao/download.js';
import { converterBwebParaGzip } from '../modules/aquisicao/limpeza.js';

function lerArgumentos(argv) {
  const opcoes = { anos: null, turnos: [], ufs: [], destino: 'bweb' };
  for (let indice = 0; indice < argv.length; indice += 1) {
    const chave = argv[indice];
    const valor = argv[indice + 1];
    if (chave === '--anos') {
      opcoes.anos = valor.split(',').map(Number);
      indice += 1;
    } else if (chave === '--turno') {
      opcoes.turnos.push(Number(valor));
      indice += 1;
    } else if (chave === '--uf') {
      opcoes.ufs.push(...valor.split(',').map((uf) => uf.trim().toUpperCase()));
      indice += 1;
    } else if (chave === '--destino') {
      opcoes.destino = valor;
      indice += 1;
    }
  }
  return opcoes;
}

async function existe(caminho) {
  try {
    await stat(caminho);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const opcoes = lerArgumentos(process.argv.slice(2));
  const anos = opcoes.anos ?? anosDisponiveis('bweb');
  let falhas = 0;

  for (const ano of anos) {
    const diretorio = path.resolve(opcoes.destino, String(ano));
    await mkdir(diretorio, { recursive: true });
    const recursos = filtrarRecursos(await listarRecursos('bweb', ano), {
      ufs: opcoes.ufs,
      turnos: opcoes.turnos,
    });
    console.log(`${ano}: ${recursos.length} recurso(s)`);

    for (const recurso of recursos) {
      const nome = path.basename(new URL(recurso.url).pathname);
      const base = nome.replace(/\.(zip|csv|txt)$/i, '');
      const compactado = path.join(diretorio, `${base}.csv.gz`);
      const temporario = path.join(diretorio, nome);

      try {
        if (await existe(compactado)) {
          console.log(`PULADO ${base} (já convertido)`);
          continue;
        }
        const { bytes } = await baixar(recurso.url, temporario);
        const convertido = await converterBwebParaGzip(temporario, compactado);
        await rm(temporario, { force: true });
        console.log(`OK ${base}.csv.gz ${bytes} bytes baixados ${convertido.bytes} bytes gzip`);
      } catch (erro) {
        falhas += 1;
        console.error(`FALHA ${nome}: ${erro.message}`);
      }
    }
  }

  if (falhas > 0) process.exit(1);
}

await main();
