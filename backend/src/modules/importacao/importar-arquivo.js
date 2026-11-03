import { stat } from 'node:fs/promises';
import { from as copyFrom } from 'pg-copy-streams';
import { sql } from 'kysely';
import { lerArquivoBweb } from './bweb/ler-arquivo.js';
import { lerAmostra } from './bweb/leitor.js';
import { registrarEventoCarga } from '../../lib/log-carga.js';
import { calcularSha256, concluirLote, falharLote, iniciarLote } from './lote.js';
import { chaveGrupo, persistirArquivo } from './persistir-bus.js';
import { criarValidador, encodingSuspeito } from './validacoes.js';

const BUS_POR_LOTE = 200;
const LIMITE_ALERTAS = 10000;
const ALERTAS_POR_INSERT = 500;

function escaparCopy(valor) {
  return String(valor)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export async function importarArquivo({
  db,
  caminho,
  nomeArquivo,
  now = new Date(),
  lerArquivo = lerArquivoBweb,
  validar,
  persistir = persistirArquivo,
  registrarEvento = registrarEventoCarga,
}) {
  if (!db.pool) {
    throw new Error('importarArquivo precisa de um db com pool para o COPY');
  }

  const inicio = Date.now();
  const sha256 = await calcularSha256(caminho);
  const { size } = await stat(caminho);

  const { ignorado, lote } = await iniciarLote(db, {
    nomeArquivo,
    sha256,
    tamanhoBytes: size,
    capturedAt: now,
  });

  if (ignorado) return { ignorado: true, lote };

  registrarEvento('lote_iniciado', {
    arquivo: nomeArquivo,
    lote_id: lote.id,
    status: lote.status,
  });

  try {
    const metricas = { registrosIgnorados: 0 };
    const arquivo = await lerArquivo(caminho, { nomeArquivo, metricas });
    let qtLinhas = 0;
    let primeiro = null;

    const cliente = await db.pool.connect();
    let falhaCopy = null;

    try {
      await cliente.query('DELETE FROM bweb_staging WHERE lote_id = $1', [lote.id]);

      const fluxo = cliente.query(
        copyFrom(
          'COPY bweb_staging (lote_id, chave, nr_linha, valores) FROM STDIN WITH (FORMAT text)',
        ),
      );

      const copiaConcluida = new Promise((resolver, rejeitar) => {
        fluxo.on('finish', resolver);
        fluxo.on('error', rejeitar);
      });

      for await (const registro of arquivo.registros) {
        if (!primeiro) primeiro = registro;
        qtLinhas += 1;

        const linha = `${lote.id}\t${escaparCopy(chaveGrupo(registro.valores))}\t${registro.nrLinha}\t${escaparCopy(JSON.stringify(registro.valores))}\n`;

        if (!fluxo.write(linha)) {
          await new Promise((resolver) => fluxo.once('drain', resolver));
        }
      }

      fluxo.end();
      await copiaConcluida;
    } catch (erro) {
      falhaCopy = erro;
      throw erro;
    } finally {
      cliente.release(falhaCopy ?? undefined);
    }

    const resultado = await db.transaction().execute(async (trx) => {
      const validador = criarValidador({ leiaute: arquivo.leiaute });
      const alertas = [];
      let qtAlertas = 0;
      let qtErros = 0;
      let importados = 0;

      const contabilizar = (lista) => {
        for (const item of lista) {
          if (item.severidade === 'erro') qtErros += 1;
          else qtAlertas += 1;
          if (alertas.length < LIMITE_ALERTAS) alertas.push(item);
        }
      };

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
        qtLinhas: qtLinhas + metricas.registrosIgnorados,
        importados,
        qtErros,
        qtAlertas,
        qtLinhasIgnoradas: metricas.registrosIgnorados,
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

    registrarEvento('lote_concluido', {
      arquivo: nomeArquivo,
      lote_id: atualizado.id,
      duracao_ms: atualizado.duracao_ms,
      linhas: atualizado.qt_linhas,
      linhas_importadas: atualizado.qt_linhas_importadas,
      erros: atualizado.qt_erros,
      alertas: atualizado.qt_alertas,
      status: atualizado.status,
    });

    return {
      ignorado: false,
      lote: atualizado,
      qtLinhasIgnoradas: resultado.qtLinhasIgnoradas,
    };
  } catch (erro) {
    await db
      .deleteFrom('bweb_staging')
      .where('lote_id', '=', lote.id)
      .execute()
      .catch(() => {});

    await falharLote(db, lote.id, {
      codigo: erro.codigo ?? 'ERRO_INTERNO',
      mensagem: erro.message,
      duracaoMs: Date.now() - inicio,
    });

    registrarEvento('lote_falhou', {
      arquivo: nomeArquivo,
      lote_id: lote.id,
      duracao_ms: Date.now() - inicio,
      erro_codigo: erro.codigo ?? 'ERRO_INTERNO',
      erro_mensagem: erro.message,
      status: 'falhou',
    });

    throw erro;
  }
}
