import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CENARIO,
  gerarBweb,
  gerarBweb2014,
  gerarBweb2014Multi,
  gerarBweb2018,
  gerarBweb2018Multi,
  gerarBwebMulti,
  opcoesDeSecoes,
} from './dados-sinteticos.js';

export * from './dados-sinteticos.js';

export const NOME_2026 = 'bweb-sintetico-2026.csv';
export const NOME_2022 = 'bweb-sintetico-2022.csv';
export const NOME_2018 = 'bweb_2t_AC_301020181744.csv';
export const NOME_2014_1T = 'bweb_1t_AC_14102014131600.txt';
export const NOME_2014_2T = 'bweb_2t_AC_28102014114450.txt';

export async function escreverArquivo(diretorio, nome, conteudo) {
  const caminho = path.join(diretorio, nome);
  await writeFile(caminho, conteudo, 'latin1');
  return caminho;
}

export function dataBuRecebido(indice) {
  const minuto = String(20 + indice).padStart(2, '0');
  return `20261004T17${minuto}00`;
}

export function secoes2026(total, base = {}) {
  return opcoesDeSecoes(total, base).map((opcao, indice) => ({
    ...opcao,
    dataBuRecebido: dataBuRecebido(indice),
  }));
}

export function secoes2018(total, base = {}) {
  return opcoesDeSecoes(total, base);
}

export function secoes2014(total, base = {}) {
  return opcoesDeSecoes(total, base);
}

export {
  CENARIO,
  gerarBweb,
  gerarBweb2014,
  gerarBweb2014Multi,
  gerarBweb2018,
  gerarBweb2018Multi,
  gerarBwebMulti,
};
