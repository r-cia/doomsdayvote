import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { anosDisponiveis, filtrarRecursos, listarRecursos } from '../modules/aquisicao/tse.js';
import { baixar } from '../modules/aquisicao/download.js';
import { limparZipBu, listarEntradas } from '../modules/aquisicao/limpeza.js';

const MANTIDOS = /-(bu|rdv)\.dat$|-log\.jez$/;

function lerArgumentos(argv) {
  const opcoes = { anos: null, turnos: [], ufs: [], destino: 'bu' };
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

async function jaLimpo(caminho) {
  try {
    const entradas = await listarEntradas(caminho);
    return entradas.length > 0 && entradas.every((nome) => MANTIDOS.test(nome));
  } catch {
    return false;
  }
}

async function main() {
  const opcoes = lerArgumentos(process.argv.slice(2));
  const anos = opcoes.anos ?? anosDisponiveis('bu');
  let falhas = 0;

  for (const ano of anos) {
    const diretorio = path.resolve(opcoes.destino, String(ano));
    await mkdir(diretorio, { recursive: true });
    const recursos = filtrarRecursos(await listarRecursos('bu', ano), {
      ufs: opcoes.ufs,
      turnos: opcoes.turnos,
    });
    console.log(`${ano}: ${recursos.length} recurso(s)`);

    for (const recurso of recursos) {
      const nome = path.basename(new URL(recurso.url).pathname);
      const destino = path.join(diretorio, nome);
      try {
        if (await jaLimpo(destino)) {
          console.log(`PULADO ${nome} (já limpo)`);
          continue;
        }
        const { bytes } = await baixar(recurso.url, destino);
        const { entradas } = await limparZipBu(destino);
        console.log(`OK ${nome} ${bytes} bytes ${entradas} entradas`);
      } catch (erro) {
        falhas += 1;
        console.error(`FALHA ${nome}: ${erro.message}`);
      }
    }
  }

  if (falhas > 0) process.exit(1);
}

await main();
