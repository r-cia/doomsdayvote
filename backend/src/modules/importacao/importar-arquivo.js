import { stat } from 'node:fs/promises';
import { lerArquivoBweb } from './bweb/ler-arquivo.js';
import { armazenarOriginal, calcularSha256, concluirLote, falharLote, iniciarLote } from './lote.js';
import { persistirArquivo } from './persistir-bus.js';

export async function importarArquivo({
  db,
  caminho,
  nomeArquivo,
  storageDir,
  now = new Date(),
  lerArquivo = lerArquivoBweb,
  validar = () => ({ importar: true, alertas: [] }),
  persistir = persistirArquivo,
}) {
  const sha256 = await calcularSha256(caminho);
  const { size } = await stat(caminho);
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
      const registros = [];
      const alertas = [];
      let qtLinhas = 0;
      let dtGeracao = null;

      for await (const registro of arquivo.registros) {
        qtLinhas += 1;
        if (!dtGeracao) dtGeracao = registro.valores.DT_GERACAO?.local ?? null;

        const validado = validar(registro);
        if (validado.alertas?.length) alertas.push(...validado.alertas);
        if (validado.importar === false) continue;

        registros.push(registro);
      }

      const { importados } = await persistir(trx, {
        loteId: lote.id,
        registros,
        metadadosDerivados: arquivo.metadadosDerivados?.campos ?? [],
      });

      if (alertas.length > 0) {
        await trx
          .insertInto('alerta_importacao')
          .values(
            alertas.map((alerta) => ({
              lote_id: lote.id,
              severidade: alerta.severidade,
              codigo: alerta.codigo,
              mensagem: alerta.mensagem,
              nr_linha: alerta.nrLinha ?? null,
              campo: alerta.campo ?? null,
              contexto: alerta.contexto ?? {},
            })),
          )
          .execute();
      }

      return {
        leiaute: arquivo.leiaute,
        qtLinhas,
        importados,
        qtErros: alertas.filter((alerta) => alerta.severidade === 'erro').length,
        qtAlertas: alertas.filter((alerta) => alerta.severidade === 'alerta').length,
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
