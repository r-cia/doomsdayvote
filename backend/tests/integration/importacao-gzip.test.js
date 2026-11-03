import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { criarDb } from '../../src/db/index.js';
import { carregarPasta } from '../../src/modules/importacao/carregar-pasta.js';
import { limparBanco } from '../helpers/db-teste.js';
import { gerarBweb } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const NOME = 'bweb-sintetico-2026.csv.gz';

let base;
let inputDir;
let conteudo;
let comprimido;

describe('carga de CSV comprimido', () => {
  beforeAll(async () => {
    base = await mkdtemp(path.join(tmpdir(), 'bweb-gzip-carga-'));
    inputDir = path.join(base, 'entrada');
    conteudo = Buffer.from(gerarBweb(), 'latin1');
    comprimido = gzipSync(conteudo, { level: 9 });
    await writeFile(path.join(base, NOME), comprimido);
  });

  beforeEach(async () => {
    await limparBanco(db);
    await rm(inputDir, { recursive: true, force: true });
    await mkdir(inputDir, { recursive: true });
    await copyFile(path.join(base, NOME), path.join(inputDir, NOME));
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(base, { recursive: true, force: true });
  });

  it(
    'importa o .gz e ignora a repetição',
    async () => {
      const resumo = await carregarPasta({ db, inputDir });

      expect(resumo.arquivos).toBe(1);
      expect(resumo.importados).toBe(1);
      expect(resumo.falhas).toBe(0);
      expect(resumo.lotes[0].linhas).toBe(6);

      const lote = await db
        .selectFrom('lote_importacao')
        .selectAll()
        .where('nome_arquivo', '=', NOME)
        .executeTakeFirstOrThrow();

      expect(lote.status).toBe('concluido');
      expect(lote.leiaute).toBe('BWEB_45');
      expect(Number(lote.tamanho_bytes)).toBe(comprimido.length);
      expect(Number(lote.tamanho_bytes)).toBeLessThan(conteudo.length);

      const secoes = await db
        .selectFrom('boletim_versao')
        .select(({ fn }) => fn.countAll().as('total'))
        .executeTakeFirstOrThrow();
      expect(Number(secoes.total)).toBe(2);

      const repetido = await carregarPasta({ db, inputDir });
      expect(repetido.ignorados).toBe(1);
      expect(repetido.importados).toBe(0);
    },
    { timeout: 120000 },
  );
});
