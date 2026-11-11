import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { criarDb } from '../../src/db/index.js';
import { carregarPasta } from '../../src/modules/importacao/carregar-pasta.js';
import { limparBanco } from '../helpers/db-teste.js';
import {
  NOME_2014_1T,
  NOME_2014_2T,
  NOME_2018,
  NOME_2022,
  NOME_2026,
  gerarBweb,
  gerarBweb2014,
  gerarBweb2018,
  escreverArquivo,
} from '../helpers/fixtures.js';

const execFileAsync = promisify(execFile);
const backendDir = fileURLToPath(new URL('../..', import.meta.url));

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const ARQUIVOS = [NOME_2014_1T, NOME_2014_2T, NOME_2018, NOME_2022, NOME_2026];
let inputDir;

describe('worker de carga manual', () => {
  beforeAll(async () => {
    inputDir = await mkdtemp(path.join(tmpdir(), 'bweb-entrada-'));
    await escreverArquivo(inputDir, NOME_2026, gerarBweb());
    await escreverArquivo(inputDir, NOME_2022, gerarBweb({ ano: 2022, eleicao: 9602, pleito: 9602 }));
    await escreverArquivo(inputDir, NOME_2018, gerarBweb2018());
    await escreverArquivo(inputDir, NOME_2014_1T, gerarBweb2014({ secao: 1 }));
    await escreverArquivo(inputDir, NOME_2014_2T, gerarBweb2014({ secao: 2 }));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(inputDir, { recursive: true, force: true });
  });

  it(
    'importa a pasta e reimporta sem duplicar',
    async () => {
      const primeiro = await carregarPasta({ db, inputDir });
      expect(primeiro.arquivos).toBe(ARQUIVOS.length);
      expect(primeiro.importados).toBe(ARQUIVOS.length);
      expect(primeiro.falhas).toBe(0);
      expect(primeiro.lotes).toHaveLength(ARQUIVOS.length);

      const segundo = await carregarPasta({ db, inputDir });
      expect(segundo.importados).toBe(0);
      expect(segundo.ignorados).toBe(ARQUIVOS.length);
    },
  );

  it(
    'ignora extensões não suportadas',
    async () => {
      await writeFile(path.join(inputDir, 'leiame.pdf'), 'conteudo');
      const resumo = await carregarPasta({ db, inputDir });
      expect(resumo.ignorados_extensao).toContain('leiame.pdf');
      expect(resumo.arquivos).toBe(ARQUIVOS.length);
    },
  );

  it(
    'continua após um arquivo com cabeçalho alterado',
    async () => {
      const linhas = gerarBweb().split(/\r?\n/);
      linhas[0] = linhas[0].replace('NR_TURMA_APURADORA', 'NR_TURMA');
      await writeFile(path.join(inputDir, 'zz-quebrado.csv'), linhas.join('\n'), 'latin1');

      const resumo = await carregarPasta({ db, inputDir });
      expect(resumo.falhas).toBe(1);
      expect(resumo.lotes.find((lote) => lote.arquivo === 'zz-quebrado.csv')).toMatchObject({
        status: 'falhou',
        erro: 'MUDANCA_LEIAUTE',
      });
    },
  );

  it('falha quando a pasta de entrada não existe', async () => {
    await expect(
      carregarPasta({ db, inputDir: path.join(inputDir, 'nao-existe') }),
    ).rejects.toBeTruthy();
  });

  it('sai com código 2 quando outra carga está em andamento', async () => {
    const cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    await cliente.query('select pg_advisory_lock($1)', [727274]);

    try {
      await expect(
        execFileAsync('node', ['src/scripts/carregar-pasta.js'], {
          cwd: backendDir,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            DATABASE_URL: url,
            DATABASE_MIGRATION_URL: process.env.TEST_DATABASE_MIGRATION_URL,
            BWEB_INPUT_DIR: inputDir,
          },
        }),
      ).rejects.toMatchObject({ code: 2 });
    } finally {
      await cliente.query('select pg_advisory_unlock($1)', [727274]);
      await cliente.end();
    }
  });
});
