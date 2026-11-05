import { mkdtemp, open, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ZipError,
  abrirZipArquivo,
  extrairEntrada,
  listarEntradas,
} from '../../../src/modules/totalizacao/zip.js';
import { gerarZip } from '../../helpers/dados-sinteticos.js';

const EOCD = Buffer.from([0x50, 0x4b, 0x05, 0x06]);

function lerEocd(zip) {
  const posicao = zip.lastIndexOf(EOCD);
  return {
    posicao,
    total: zip.readUInt16LE(posicao + 10),
    tamanhoDiretorio: zip.readUInt32LE(posicao + 12),
    inicioDiretorio: zip.readUInt32LE(posicao + 16),
  };
}

function deslocarZip(zip, deslocamento) {
  const copia = Buffer.from(zip);
  const { total, inicioDiretorio } = lerEocd(copia);
  let offset = inicioDiretorio;

  for (let indice = 0; indice < total; indice += 1) {
    const tamanhoNome = copia.readUInt16LE(offset + 28);
    const tamanhoExtra = copia.readUInt16LE(offset + 30);
    const tamanhoComentario = copia.readUInt16LE(offset + 32);
    copia.writeUInt32LE(copia.readUInt32LE(offset + 42) + deslocamento, offset + 42);
    offset += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  copia.writeUInt32LE(inicioDiretorio + deslocamento, lerEocd(copia).posicao + 16);
  return copia;
}

function paraZip64(zip) {
  const { total, inicioDiretorio } = lerEocd(zip);
  const registros = [];
  let offset = inicioDiretorio;

  for (let indice = 0; indice < total; indice += 1) {
    const tamanhoNome = zip.readUInt16LE(offset + 28);
    const tamanhoExtra = zip.readUInt16LE(offset + 30);
    const tamanhoComentario = zip.readUInt16LE(offset + 32);
    const registro = Buffer.alloc(46 + tamanhoNome + 28);
    zip.copy(registro, 0, offset, offset + 46 + tamanhoNome);
    registro.writeUInt32LE(0xffffffff, 20);
    registro.writeUInt32LE(0xffffffff, 24);
    registro.writeUInt32LE(0xffffffff, 42);
    registro.writeUInt16LE(28, 30);

    const extra = registro.subarray(46 + tamanhoNome);
    extra.writeUInt16LE(0x0001, 0);
    extra.writeUInt16LE(24, 2);
    extra.writeBigUInt64LE(BigInt(zip.readUInt32LE(offset + 24)), 4);
    extra.writeBigUInt64LE(BigInt(zip.readUInt32LE(offset + 20)), 12);
    extra.writeBigUInt64LE(BigInt(zip.readUInt32LE(offset + 42)), 20);

    registros.push(registro);
    offset += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  const diretorio = Buffer.concat(registros);
  const eocd64 = Buffer.alloc(56);
  eocd64.writeUInt32LE(0x06064b50, 0);
  eocd64.writeBigUInt64LE(44n, 4);
  eocd64.writeUInt16LE(45, 12);
  eocd64.writeUInt16LE(45, 14);
  eocd64.writeBigUInt64LE(BigInt(total), 24);
  eocd64.writeBigUInt64LE(BigInt(total), 32);
  eocd64.writeBigUInt64LE(BigInt(diretorio.length), 40);
  eocd64.writeBigUInt64LE(BigInt(inicioDiretorio), 48);

  const localizador = Buffer.alloc(20);
  localizador.writeUInt32LE(0x07064b50, 0);
  localizador.writeBigUInt64LE(BigInt(inicioDiretorio + diretorio.length), 8);
  localizador.writeUInt32LE(1, 16);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0xffff, 8);
  eocd.writeUInt16LE(0xffff, 10);
  eocd.writeUInt32LE(0xffffffff, 12);
  eocd.writeUInt32LE(0xffffffff, 16);

  return Buffer.concat([zip.subarray(0, inicioDiretorio), diretorio, eocd64, localizador, eocd]);
}

function corromperCrc(zip) {
  const copia = Buffer.from(zip);
  const { inicioDiretorio } = lerEocd(copia);
  copia.writeUInt32LE(copia.readUInt32LE(inicioDiretorio + 16) ^ 0xffffffff, inicioDiretorio + 16);
  return copia;
}

let diretorio;

beforeAll(async () => {
  diretorio = await mkdtemp(path.join(tmpdir(), 'zip-arquivo-'));
});

afterAll(async () => {
  await rm(diretorio, { recursive: true, force: true });
});

async function gravar(nome, buffer, deslocamento = 0) {
  const caminho = path.join(diretorio, nome);
  const arquivo = await open(caminho, 'w');
  try {
    if (deslocamento > 0) await arquivo.truncate(deslocamento);
    await arquivo.write(buffer, 0, buffer.length, deslocamento);
  } finally {
    await arquivo.close();
  }
  return caminho;
}

describe('abrirZipArquivo', () => {
  it('lê as mesmas entradas e conteúdos que a leitura em memória', async () => {
    const zip = gerarZip([
      ['secao-a-bu.dat', 'conteudo-a'],
      ['secao-a-rdv.dat', 'conteudo-b'],
    ]);
    const caminho = await gravar('equivalente.zip', zip);

    const arquivo = await abrirZipArquivo(caminho);
    try {
      const esperadas = listarEntradas(zip, 'arquivo zip');
      expect(arquivo.entradas.map((entrada) => entrada.nome)).toEqual(
        esperadas.map((entrada) => entrada.nome),
      );

      for (const entrada of arquivo.entradas) {
        const referencia = esperadas.find((item) => item.nome === entrada.nome);
        expect(await arquivo.extrair(entrada)).toEqual(
          extrairEntrada(zip, referencia, 'arquivo zip'),
        );
      }
    } finally {
      await arquivo.fechar();
    }
  });

  it('preserva CRC_DIVERGENTE por entrada', async () => {
    const zip = corromperCrc(gerarZip([['secao-a-bu.dat', 'conteudo']]));
    const caminho = await gravar('crc.zip', zip);

    const arquivo = await abrirZipArquivo(caminho);
    try {
      const erro = await arquivo.extrair(arquivo.entradas[0]).catch((falha) => falha);
      expect(erro).toBeInstanceOf(ZipError);
      expect(erro.codigo).toBe('CRC_DIVERGENTE');
    } finally {
      await arquivo.fechar();
    }
  });

  it('lê ZIP64 com sentinelas no diretório central', async () => {
    const zip = paraZip64(
      gerarZip([
        ['secao-a-bu.dat', 'conteudo-a'],
        ['secao-a-rdv.dat', 'conteudo-b'],
      ]),
    );
    const caminho = await gravar('zip64.zip', zip);

    const arquivo = await abrirZipArquivo(caminho);
    try {
      expect(arquivo.entradas).toHaveLength(2);
      expect((await arquivo.extrair(arquivo.entradas[1])).toString()).toBe('conteudo-b');
    } finally {
      await arquivo.fechar();
    }
  });

  it('lê arquivo acima de 2 GiB sem carregar o conteúdo em memória', async () => {
    const deslocamento = 2.5 * 1024 ** 3;
    const zip = deslocarZip(gerarZip([['secao-a-bu.dat', 'conteudo']]), deslocamento);
    const caminho = await gravar('grande.zip', zip, deslocamento);

    expect((await stat(caminho)).size).toBeGreaterThan(2 ** 31);

    const arquivo = await abrirZipArquivo(caminho);
    try {
      expect(arquivo.entradas).toHaveLength(1);
      expect((await arquivo.extrair(arquivo.entradas[0])).toString()).toBe('conteudo');
    } finally {
      await arquivo.fechar();
    }
  });
});
