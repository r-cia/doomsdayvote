import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { detectarLeiaute } from '../../../src/modules/importacao/bweb/detectar-leiaute.js';
import { lerPrimeiraLinha } from '../../../src/modules/importacao/bweb/leitor.js';
import { gerarBweb45 } from '../../helpers/dados-sinteticos.js';

const executar = promisify(execFile);

async function temSeteZip() {
  try {
    await executar('7z', ['i']);
    return true;
  } catch {
    return false;
  }
}

const disponivel = await temSeteZip();
let diretorio;
let arquivo7z;
const NOME_CSV = 'bweb_1t_AC_051020261403.csv';

beforeAll(async () => {
  if (!disponivel) return;
  diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-7z-'));
  await writeFile(path.join(diretorio, NOME_CSV), gerarBweb45(), 'latin1');
  await executar('7z', ['a', '-t7z', `${NOME_CSV}.7z`, NOME_CSV], { cwd: diretorio });
  arquivo7z = path.join(diretorio, `${NOME_CSV}.7z`);
});

afterAll(async () => {
  if (diretorio) await rm(diretorio, { recursive: true, force: true });
});

describe('leitor de .csv.7z', () => {
  it.skipIf(!disponivel)('lê o CSV comprimido em 7z sem arquivo temporário', async () => {
    const esperado = await readFile(path.join(diretorio, NOME_CSV), 'latin1');
    const primeira = await lerPrimeiraLinha(arquivo7z);

    expect(primeira.campos.length).toBe(45);
    expect(primeira.campos[0].trim()).toBe('DT_GERACAO');
    expect(esperado.startsWith('DT_GERACAO')).toBe(true);
    expect(await detectarLeiaute(arquivo7z)).toBe('BWEB_45');
  });

  it.skipIf(disponivel)('é ignorado quando o binário 7z não está disponível', () => {
    expect(disponivel).toBe(false);
  });
});
