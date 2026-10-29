import { fileURLToPath } from 'node:url';

export const FIXTURES = [
  'bweb-1t_ac_2026.csv',
  'bweb_1t_AC_051020221321.csv',
  'bweb_2t_AC_301020181744.csv',
  'bweb_1t_AC_14102014131600.txt',
  'bweb_1t_AC_101020181938.csv',
  'bweb_2t_AC_28102014114450.txt',
];

export const LINHAS_POR_FIXTURE = {
  'bweb-1t_ac_2026.csv': 1529,
  'bweb_1t_AC_051020221321.csv': 6545,
  'bweb_2t_AC_301020181744.csv': 2973,
  'bweb_1t_AC_14102014131600.txt': 5565,
  'bweb_1t_AC_101020181938.csv': 300,
  'bweb_2t_AC_28102014114450.txt': 300,
};

export function caminhoFixture(nome) {
  return fileURLToPath(new URL(`../fixtures/bweb/${nome}`, import.meta.url));
}
