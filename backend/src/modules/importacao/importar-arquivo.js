import { readFile, stat } from 'node:fs/promises';
import { lerArquivoBweb } from './bweb/ler-arquivo.js';
import { armazenarOriginal, calcularSha256, concluirLote, falharLote, iniciarLote } from './lote.js';
import { persistirArquivo } from './persistir-bus.js';
import { validarRegistros } from './validacoes.js';

export async function importarArquivo({
  db,
  caminho,
  nomeArquivo,
  storageDir,
  now = new Date(),
  lerArquivo = lerArquivoBweb,
  validar = validarRegistros,
  persistir = persistirArquivo,
}) {
  const sha256 = await calcularSha256(caminho);
  const { size } = await stat(caminho);
  const buffer = await readFile(caminho);
  const caminhoArmazenado = await armazenarOriginal(caminho, sha256, storageDir);

  const { ignorado, lote } = await iniciarLote(db, {
    nomeArquivo,
    caminhoArmazenado,
    sha256,
    tamanhoBytes: size,
    capturedAt: now,
  });

  if (ignorado) return { ignorado: true, lote };

  const inicio = Date.now();

  try {
    const resultado = await db.transaction().execute(async (trx) => {
      const arquivo = await lerArquivo(caminho, { nomeArquivo });
      const lidos = [];
      for await (const registro of arquivo.registros) lidos.push(registro);

      const validado = validar(lidos, { leiaute: arquivo.leiaute, buffer });
      const alertas = validado.alertas ?? [];
      const dtGeracao = lidos[0]?.valores.DT_GERACAO?.local ?? null;

      const { importados } = await persistir(trx, {
        loteId: lote.id,
        registros: validado.registros,
        metadadosDerivados: arquivo.metadadosDerivados?.campos ?? [],
      });

      if (alertas.length > 0) {
        await trx
          .insertInto('alerta_importacao')
          .values(
            alertas.map((item) => ({
              lote_id: lote.id,
              severidade: item.severidade,
              codigo: item.codigo,
              mensagem: item.mensagem,
              nr_linha: item.nrLinha ?? null,
              campo: item.campo ?? null,
              contexto: item.contexto ?? {},
            })),
          )
          .execute();
      }

      return {
        leiaute: arquivo.leiaute,
        qtLinhas: lidos.length,
        importados,
        qtErros: alertas.filter((item) => item.severidade === 'erro').length,
        qtAlertas: alertas.filter((item) => item.severidade === 'alerta').length,
        dtGeracao: arquivo.metadadosDerivados?.geracaoNoNome ?? dtGeracao,
        metadados: {
          cabecalhoOriginal: arquivo.cabecalhoOriginal,
          aliasesAplicados: arquivo.aliasesAplicados,
          metadadosDerivados: arquivo.metadadosDerivados ?? null,
        },
      };
    });

    const atualizado = await concluirLote(db, lote.id, {
      leiaute: resultado.leiaute,
      dtGeracaoArquivo: resultado.dtGeracao,
      qtLinhas: resultado.qtLinhas,
      qtLinhasImportadas: resultado.importados,
      qtErros: resultado.qtErros,
      qtAlertas: resultado.qtAlertas,
      metadados: resultado.metadados,
      duracaoMs: Date.now() - inicio,
    });

    return { ignorado: false, lote: atualizado };
  } catch (erro) {
    await falharLote(db, lote.id, {
      codigo: erro.codigo ?? 'ERRO_INTERNO',
      mensagem: erro.message,
    });
    throw erro;
  }
}
