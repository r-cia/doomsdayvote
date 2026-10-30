import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { detectarLeiaute } from '../../../src/modules/importacao/bweb/detectar-leiaute.js';
import { lerLinhas, lerPrimeiraLinha } from '../../../src/modules/importacao/bweb/leitor.js';
import { caminhoFixture } from '../../helpers/fixtures.js';

let diretorio;

async function contarLinhas(caminho) {
  let total = 0;
  for await (const _ of lerLinhas(caminho)) total += 1;
  return total;
}

describe('leitor com gzip', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-gzip-'));
  });

  afterAll(async () => {
    await rm(diretorio, { recursive: true, force: true });
  });

  it('lê um CSV comprimido com gzip -9 como se fosse texto', async () => {
    const original = caminhoFixture('bweb-1t_ac_2026.csv');
    const comprimido = path.join(diretorio, 'bweb-1t_ac_2026.csv.gz');
    await writeFile(comprimido, gzipSync(await readFile(original), { level: 9 }));

    expect(await detectarLeiaute(comprimido)).toBe('BWEB_45');
    expect(await contarLinhas(comprimido)).toBe(await contarLinhas(original));

    const primeira = await lerPrimeiraLinha(comprimido);
    expect(primeira.campos[0]).toBe('DT_GERACAO');
    expect(primeira.campos).toHaveLength(45);
  });

  it('descarta bytes NUL sem quebra de linha', async () => {
    const comprimido = path.join(diretorio, 'nulos.csv.gz');
    const conteudo = Buffer.concat([
      Buffer.from('"A";"B"\r\n"1";"2"'),
      Buffer.alloc(8 * 1024 * 1024),
      Buffer.from('\r\n"3";"4"\r\n'),
    ]);
    await writeFile(comprimido, gzipSync(conteudo));

    const linhas = [];
    for await (const { campos } of lerLinhas(comprimido)) linhas.push(campos);
    expect(linhas).toEqual([['A', 'B'], ['1', '2'], ['3', '4']]);
  });

  it('recusa um .gz corrompido com código próprio', async () => {
    const quebrado = path.join(diretorio, 'quebrado.csv.gz');
    await writeFile(quebrado, Buffer.from('isto nao e um arquivo gzip'));

    await expect(
      (async () => {
        for await (const _ of lerLinhas(quebrado)) {
          void _;
        }
      })(),
    ).rejects.toMatchObject({ codigo: 'ARQUIVO_GZ_INVALIDO' });
  });
});
