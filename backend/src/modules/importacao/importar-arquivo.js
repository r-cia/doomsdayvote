import { sql } from 'kysely';
import { stat } from 'node:fs/promises';
import { lerArquivoBweb } from './bweb/ler-arquivo.js';
import { lerAmostra } from './bweb/leitor.js';
import { armazenarOriginal, calcularSha256, concluirLote, falharLote, iniciarLote } from './lote.js';
import { chaveGrupo, persistirArquivo } from './persistir-bus.js';
import { criarValidador, encodingSuspeito } from './validacoes.js';

const LINHAS_POR_INSERT = 1000;
const BUS_POR_LOTE = 200;
const LIMITE_ALERTAS = 10000;
const ALERTAS_POR_INSERT = 500;

export async function importarArquivo({
  db,
  caminho,
  nomeArquivo,
  storageDir,
  now = new Date(),
  lerArquivo = lerArquivoBweb,
  validar,
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
      const validador = criarValidador({ leiaute: arquivo.leiaute });
      const alertas = [];
      let qtAlertas = 0;
      let qtErros = 0;
      let qtLinhas = 0;
      let importados = 0;
      let primeiro = null;
      let staging = [];

      const contabilizar = (lista) => {
        for (const item of lista) {
          if (item.severidade === 'erro') qtErros += 1;
          else qtAlertas += 1;
          if (alertas.length < LIMITE_ALERTAS) alertas.push(item);
        }
      };

      const descarregarStaging = async () => {
        if (staging.length === 0) return;
        await trx.insertInto('bweb_staging').values(staging).execute();
        staging = [];
      };

      for await (const registro of arquivo.registros) {
        if (!primeiro) primeiro = registro;
        qtLinhas += 1;
        staging.push({
          lote_id: lote.id,
          chave: chaveGrupo(registro.valores),
          nr_linha: registro.nrLinha,
          valores: registro.valores,
        });
        if (staging.length >= LINHAS_POR_INSERT) await descarregarStaging();
      }
      await descarregarStaging();

      const { rows: chaves } = await sql`
        select distinct chave from bweb_staging
        where lote_id = ${lote.id}
        order by chave
      `.execute(trx);

      for (let i = 0; i < chaves.length; i += BUS_POR_LOTE) {
        const bloco = chaves.slice(i, i + BUS_POR_LOTE).map((linha) => linha.chave);

        const linhas = await trx
          .selectFrom('bweb_staging')
          .select(['chave', 'nr_linha', 'valores'])
          .where('lote_id', '=', lote.id)
          .where('chave', 'in', bloco)
          .orderBy('chave')
          .orderBy('nr_linha')
          .execute();

        const registros = linhas.map((linha) => ({
          nrLinha: linha.nr_linha,
          valores: linha.valores,
        }));

        const validado = validar
          ? validar(registros, { leiaute: arquivo.leiaute })
          : validador.validarGrupo(registros);

        contabilizar(validado.alertas ?? []);

        if (validado.registros.length > 0) {
          const { importados: novos } = await persistir(trx, {
            loteId: lote.id,
            registros: validado.registros,
            metadadosDerivados: arquivo.metadadosDerivados?.campos ?? [],
          });
          importados += novos;
        }
      }

      await sql`delete from bweb_staging where lote_id = ${lote.id}`.execute(trx);

      const amostra = await lerAmostra(caminho);
      if (encodingSuspeito(amostra)) {
        contabilizar([
          {
            severidade: 'alerta',
            codigo: 'ENCODING_SUSPEITO',
            mensagem: 'Arquivo parece UTF-8 ou tem BOM; esperado Latin-1',
            nrLinha: null,
            campo: null,
            contexto: {},
          },
        ]);
      }

      for (let i = 0; i < alertas.length; i += ALERTAS_POR_INSERT) {
        await trx
          .insertInto('alerta_importacao')
          .values(
            alertas.slice(i, i + ALERTAS_POR_INSERT).map((item) => ({
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
        qtLinhas,
        importados,
        qtErros,
        qtAlertas,
        dtGeracao:
          arquivo.metadadosDerivados?.geracaoNoNome ??
          primeiro?.valores.DT_GERACAO?.local ??
          null,
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
