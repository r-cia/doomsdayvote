import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';

export const DIRETORIO_MIGRACOES = fileURLToPath(new URL('../migrations', import.meta.url));

export async function migracoesPendentes(db, diretorio = DIRETORIO_MIGRACOES) {
  let arquivos;
  try {
    arquivos = await readdir(diretorio);
  } catch (erro) {
    if (erro.code === 'ENOENT') return [];
    throw erro;
  }

  const nomesArquivos = arquivos
    .filter((arquivo) => arquivo.endsWith('.js'))
    .map((arquivo) => arquivo.replace(/\.js$/, ''))
    .sort();

  const { rows } = await sql`SELECT to_regclass('kysely_migration') AS tabela`.execute(db);
  if (!rows[0]?.tabela) return nomesArquivos;

  const { rows: aplicadas } = await sql`SELECT name FROM kysely_migration`.execute(db);
  const nomesAplicados = new Set(aplicadas.map((linha) => linha.name));

  return nomesArquivos.filter((nome) => !nomesAplicados.has(nome));
}
