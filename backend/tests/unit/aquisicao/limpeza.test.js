import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { baixar } from '../../../src/modules/aquisicao/download.js';
import {
  converterBwebParaGzip,
  limparZipBu,
  listarEntradas,
} from '../../../src/modules/aquisicao/limpeza.js';
import { gerarZip } from '../../helpers/dados-sinteticos.js';

let diretorio;

beforeAll(async () => {
  diretorio = await mkdtemp(path.join(tmpdir(), 'aquisicao-'));
});

afterAll(async () => {
  await rm(diretorio, { recursive: true, force: true });
});

describe('download', () => {
  it('grava o corpo da resposta e remove o parcial', async () => {
    const servidor = createServer((_, resposta) => {
      resposta.writeHead(200, { 'content-type': 'application/zip' });
      resposta.end('conteudo');
    });
    await new Promise((resolver) => servidor.listen(0, resolver));
    const porta = servidor.address().port;
    const destino = path.join(diretorio, 'baixado.bin');

    try {
      const { bytes } = await baixar(`http://127.0.0.1:${porta}/arquivo`, destino);
      expect(bytes).toBe(8);
      expect(await readFile(destino, 'utf8')).toBe('conteudo');
      await expect(readFile(`${destino}.part`, 'utf8')).rejects.toThrow();
    } finally {
      servidor.close();
    }
  });

  it('falha quando o servidor responde erro', async () => {
    const servidor = createServer((_, resposta) => {
      resposta.writeHead(404);
      resposta.end();
    });
    await new Promise((resolver) => servidor.listen(0, resolver));
    const porta = servidor.address().port;

    try {
      await expect(
        baixar(`http://127.0.0.1:${porta}/nao-existe`, path.join(diretorio, 'x.bin'), {
          tentativas: 1,
        }),
      ).rejects.toThrow(/404/);
    } finally {
      servidor.close();
    }
  });
});

describe('limpeza de BU', () => {
  it('mantém apenas bu, rdv e log', async () => {
    const zip = gerarZip([
      ['secao-bu.dat', 'bu'],
      ['secao-rdv.dat', 'rdv'],
      ['secao-log.jez', 'log'],
      ['secao-vota.vsc', 'vsc'],
      ['secao-imgbu.dat', 'imgbu'],
      ['secao-busa.dat', 'busa'],
      ['leiame.pdf', 'pdf'],
    ]);
    const caminho = path.join(diretorio, 'bu.zip');
    await writeFile(caminho, zip);

    const { entradas } = await limparZipBu(caminho);

    expect(entradas).toBe(3);
    expect((await listarEntradas(caminho)).sort()).toEqual([
      'secao-bu.dat',
      'secao-log.jez',
      'secao-rdv.dat',
    ]);
  });

  it('mantém apenas bu, rdv e log no padrão de 2022', async () => {
    const zip = gerarZip([
      ['o00406-0111200060046.bu', 'bu'],
      ['o00406-0111200060046.rdv', 'rdv'],
      ['o00406-0111200060046.logjez', 'log'],
      ['o00406-0111200060046.imgbu', 'imgbu'],
      ['o00406-0111200060046.vscmr', 'vscmr'],
    ]);
    const caminho = path.join(diretorio, 'bu-2022.zip');
    await writeFile(caminho, zip);

    const { entradas } = await limparZipBu(caminho);

    expect(entradas).toBe(3);
    expect((await listarEntradas(caminho)).sort()).toEqual([
      'o00406-0111200060046.bu',
      'o00406-0111200060046.logjez',
      'o00406-0111200060046.rdv',
    ]);
  });
});

describe('conversão de BWEB', () => {
  it('extrai o csv do zip e grava gzip', async () => {
    const zip = gerarZip([['bweb_1t_AC.csv', 'linha1\nlinha2\n']]);
    const origem = path.join(diretorio, 'bweb.zip');
    const destino = path.join(diretorio, 'bweb.csv.gz');
    await writeFile(origem, zip);

    await converterBwebParaGzip(origem, destino);

    expect(gunzipSync(await readFile(destino)).toString()).toBe('linha1\nlinha2\n');
  });

  it('compacta csv direto', async () => {
    const origem = path.join(diretorio, 'direto.csv');
    const destino = path.join(diretorio, 'direto.csv.gz');
    await writeFile(origem, 'a;b\n1;2\n');

    await converterBwebParaGzip(origem, destino);

    expect(gunzipSync(await readFile(destino)).toString()).toBe('a;b\n1;2\n');
  });
});
