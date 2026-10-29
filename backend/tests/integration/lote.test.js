import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { dividirLinhaBweb } from '../../src/modules/importacao/bweb/leitor.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const fixture = fileURLToPath(new URL('../fixtures/bweb/bweb-1t_ac_2026.csv', import.meta.url));
const SHA = '2996a34dfe22cc3a9a06589b82631144eb98f5b391ef9ab6689b97b8cf9c864c';

const db = criarDb({ connectionString: url });
let storageDir;

function juntar(campos) {
  return campos.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(';');
}

async function limpar() {
  await sql`UPDATE boletim_versao SET substitui_versao_id = NULL`.execute(db);
  await sql`DELETE FROM resultado_votavel`.execute(db);
  await sql`DELETE FROM alerta_importacao`.execute(db);
  await sql`DELETE FROM boletim_versao`.execute(db);
  await sql`DELETE FROM lote_importacao`.execute(db);
  await sql`DELETE FROM secao_eleitoral`.execute(db);
  await sql`DELETE FROM localidade`.execute(db);
  await sql`DELETE FROM eleicao`.execute(db);
  await sql`DELETE FROM malha_geografica`.execute(db);
}

async function contar(tabela) {
  const { rows } = await sql`SELECT count(*)::int AS total FROM ${sql.table(tabela)}`.execute(db);
  return rows[0].total;
}

async function copiaAlterada(nome, alterar) {
  const conteudo = await readFile(fixture, 'latin1');
  const linhas = conteudo.split(/\r?\n/);
  const header = dividirLinhaBweb(linhas[0]);
  const corpo = linhas.slice(1).filter((linha) => linha !== '');
  const alteradas = corpo.map((linha) => juntar(alterar(dividirLinhaBweb(linha), header)));
  const destino = path.join(storageDir, nome);
  await writeFile(destino, `${linhas[0]}\n${alteradas.join('\n')}\n`, 'latin1');
  return destino;
}

describe('importação idempotente e versionada', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-lote-'));
  });

  beforeEach(async () => {
    await limpar();
  });

  afterAll(async () => {
    await limpar();
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('importa, guarda o original e é idempotente', async () => {
    const primeiro = await importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir });

    expect(primeiro.ignorado).toBe(false);
    expect(primeiro.lote.status).toBe('concluido');
    expect(primeiro.lote.sha256).toBe(SHA);
    expect(primeiro.lote.qt_linhas).toBe(1529);
    expect(existsSync(path.join(storageDir, 'originais', `${SHA}.csv`))).toBe(true);

    const versoes = await contar('boletim_versao');
    const resultados = await contar('resultado_votavel');
    expect(versoes).toBeGreaterThan(0);
    expect(resultados).toBe(1529);

    const segundo = await importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir });
    expect(segundo.ignorado).toBe(true);
    expect(await contar('boletim_versao')).toBe(versoes);
    expect(await contar('resultado_votavel')).toBe(resultados);
    expect(await contar('lote_importacao')).toBe(1);
  });

  it('cria versão 2 ativa e mantém a 1 inativa quando o BU muda', async () => {
    const primeiro = await importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir });
    const ativasAntes = await db
      .selectFrom('boletim_versao')
      .select(({ fn }) => fn.countAll().as('total'))
      .where('ativo', '=', true)
      .executeTakeFirstOrThrow();

    let primeira = true;
    const alterado = await copiaAlterada('bweb-1t_ac_2026-qt.csv', (campos, header) => {
      const indice = header.indexOf('QT_VOTOS');
      if (primeira) {
        campos[indice] = String(Number(campos[indice]) + 1);
        primeira = false;
      }
      return campos;
    });

    const segundo = await importarArquivo({ db, caminho: alterado, nomeArquivo: path.basename(alterado), storageDir });
    expect(segundo.ignorado).toBe(false);

    const v2 = await db.selectFrom('boletim_versao').selectAll().where('versao', '=', 2).where('ativo', '=', true).execute();
    expect(v2).toHaveLength(1);
    expect(v2[0].substitui_versao_id).toBeTruthy();

    const v1 = await db.selectFrom('boletim_versao').selectAll().where('versao', '=', 1).where('ativo', '=', false).execute();
    expect(v1).toHaveLength(1);

    const ativasDepois = await db
      .selectFrom('boletim_versao')
      .select(({ fn }) => fn.countAll().as('total'))
      .where('ativo', '=', true)
      .executeTakeFirstOrThrow();
    expect(Number(ativasDepois.total)).toBe(Number(ativasAntes.total));

    const alertas = await db
      .selectFrom('alerta_importacao')
      .selectAll()
      .where('lote_id', '=', segundo.lote.id)
      .where('codigo', '=', 'VERSAO_BU_CONFLITANTE')
      .execute();
    expect(alertas).toHaveLength(1);
  });

  it('não cria versão quando só DT_GERACAO muda', async () => {
    await importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir });
    const versoes = await contar('boletim_versao');

    const alterado = await copiaAlterada('bweb-1t_ac_2026-geracao.csv', (campos, header) => {
      campos[header.indexOf('DT_GERACAO')] = '05/10/2026';
      campos[header.indexOf('HH_GERACAO')] = '10:00:00';
      return campos;
    });

    const segundo = await importarArquivo({ db, caminho: alterado, nomeArquivo: path.basename(alterado), storageDir });
    expect(segundo.lote.status).toBe('concluido');
    expect(await contar('boletim_versao')).toBe(versoes);
  });

  it('marca falha sem dados parciais e retoma o mesmo lote', async () => {
    const falha = async () => {
      throw new Error('falha simulada');
    };

    await expect(
      importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir, persistir: falha }),
    ).rejects.toThrow('falha simulada');

    const loteFalhou = await db.selectFrom('lote_importacao').selectAll().where('sha256', '=', SHA).executeTakeFirstOrThrow();
    expect(loteFalhou.status).toBe('falhou');
    expect(loteFalhou.erro_codigo).toBe('ERRO_INTERNO');
    expect(await contar('boletim_versao')).toBe(0);

    const retomada = await importarArquivo({ db, caminho: fixture, nomeArquivo: path.basename(fixture), storageDir });
    expect(retomada.lote.id).toBe(loteFalhou.id);
    expect(retomada.lote.status).toBe('concluido');
  });

  it('falha antes de criar lote quando o arquivo não existe', async () => {
    await expect(
      importarArquivo({ db, caminho: path.join(storageDir, 'nao-existe.csv'), nomeArquivo: 'nao-existe.csv', storageDir }),
    ).rejects.toBeTruthy();
    expect(await contar('lote_importacao')).toBe(0);
  });
});
