import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { instanteOrigemSql } from '../../lib/datas.js';

export function calcularSha256(caminho) {
  return new Promise((resolver, rejeitar) => {
    const hash = createHash('sha256');
    const stream = createReadStream(caminho);
    stream.on('error', rejeitar);
    stream.on('data', (bloco) => hash.update(bloco));
    stream.on('end', () => resolver(hash.digest('hex')));
  });
}

export async function armazenarOriginal(caminho, sha256, storageDir) {
  const diretorio = path.join(storageDir, 'originais');
  await mkdir(diretorio, { recursive: true });
  const extensao = path.extname(caminho).toLowerCase();
  const destino = path.join(diretorio, `${sha256}${extensao}`);

  try {
    await copyFile(caminho, destino, constants.COPYFILE_EXCL);
  } catch (erro) {
    if (erro.code !== 'EEXIST') throw erro;
  }

  return destino;
}

export async function iniciarLote(db, { nomeArquivo, caminhoArmazenado, sha256, tamanhoBytes, capturedAt }) {
  const existente = await db
    .selectFrom('lote_importacao')
    .selectAll()
    .where('sha256', '=', sha256)
    .executeTakeFirst();

  if (existente?.status === 'concluido') {
    return { ignorado: true, lote: existente };
  }

  if (existente) {
    const lote = await db
      .updateTable('lote_importacao')
      .set({
        status: 'processando',
        started_at: new Date(),
        imported_at: null,
        duracao_ms: null,
        qt_linhas: null,
        qt_linhas_importadas: null,
        qt_erros: 0,
        qt_alertas: 0,
        erro_codigo: null,
        erro_mensagem: null,
      })
      .where('id', '=', existente.id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return { ignorado: false, lote };
  }

  const lote = await db
    .insertInto('lote_importacao')
    .values({
      nome_arquivo: nomeArquivo,
      caminho_armazenado: caminhoArmazenado,
      sha256,
      tamanho_bytes: tamanhoBytes,
      captured_at: capturedAt,
      started_at: new Date(),
      status: 'processando',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { ignorado: false, lote };
}

export async function concluirLote(db, loteId, { leiaute, dtGeracaoArquivo, qtLinhas, qtLinhasImportadas, qtErros, qtAlertas, metadados, duracaoMs }) {
  return db
    .updateTable('lote_importacao')
    .set({
      status: 'concluido',
      leiaute,
      dt_geracao_arquivo: instanteOrigemSql(dtGeracaoArquivo),
      qt_linhas: qtLinhas,
      qt_linhas_importadas: qtLinhasImportadas,
      qt_erros: qtErros,
      qt_alertas: qtAlertas,
      metadados: metadados ?? {},
      imported_at: new Date(),
      duracao_ms: duracaoMs,
    })
    .where('id', '=', loteId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function falharLote(db, loteId, { codigo, mensagem }) {
  return db
    .updateTable('lote_importacao')
    .set({
      status: 'falhou',
      erro_codigo: codigo,
      erro_mensagem: mensagem,
      imported_at: new Date(),
    })
    .where('id', '=', loteId)
    .returningAll()
    .executeTakeFirstOrThrow();
}
