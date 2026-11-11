import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { contar, limparBanco } from '../helpers/db-teste.js';
import {
  NOME_2014_1T,
  NOME_2014_2T,
  NOME_2018,
  NOME_2022,
  NOME_2026,
  escreverArquivo,
  gerarBweb,
  gerarBweb2014,
  gerarBweb2018,
} from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let diretorio;

const ARQUIVOS = [
  { nome: NOME_2026, conteudo: () => gerarBweb(), linhas: 6 },
  { nome: NOME_2022, conteudo: () => gerarBweb({ ano: 2022, eleicao: 9602, pleito: 9602 }), linhas: 6 },
  { nome: NOME_2018, conteudo: () => gerarBweb2018(), linhas: 4 },
  { nome: NOME_2014_1T, conteudo: () => gerarBweb2014({ secao: 1 }), linhas: 4 },
  { nome: NOME_2014_2T, conteudo: () => gerarBweb2014({ secao: 2 }), linhas: 4 },
];

describe('importação dos cenários sintéticos com proveniência', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-fixtures-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it(
    'importa os cenários sintéticos separados por ano, UF e turno',
    async () => {
      for (const arquivo of ARQUIVOS) {
        const caminho = await escreverArquivo(diretorio, arquivo.nome, arquivo.conteudo());
        const resultado = await importarArquivo({
          db,
          caminho,
          nomeArquivo: arquivo.nome,
        });

        expect(resultado.ignorado).toBe(false);
        expect(resultado.lote.status).toBe('concluido');
        expect(resultado.lote.qt_linhas).toBe(arquivo.linhas);
        expect(resultado.lote.sha256).toMatch(/^[0-9a-f]{64}$/);
      }

      expect(await contar(db, 'lote_importacao')).toBe(ARQUIVOS.length);
      const eleicoes = await db
        .selectFrom('eleicao')
        .select(['ano_eleicao', 'nr_turno'])
        .distinct()
        .execute();
      expect(eleicoes).toHaveLength(5);

      const semOrigem = await db
        .selectFrom('resultado_votavel')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('lote_id', 'is', null)
        .executeTakeFirstOrThrow();
      expect(Number(semOrigem.total)).toBe(0);

      const semLinha = await db
        .selectFrom('resultado_votavel')
        .select(({ fn }) => fn.countAll().as('total'))
        .where('nr_linha_origem', 'is', null)
        .executeTakeFirstOrThrow();
      expect(Number(semLinha.total)).toBe(0);

      const segundo = await importarArquivo({
        db,
        caminho: path.join(diretorio, ARQUIVOS[0].nome),
        nomeArquivo: ARQUIVOS[0].nome,
      });
      expect(segundo.ignorado).toBe(true);
      expect(await contar(db, 'lote_importacao')).toBe(ARQUIVOS.length);
    },
  );
});
