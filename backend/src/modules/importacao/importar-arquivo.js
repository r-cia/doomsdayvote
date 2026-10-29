import { stat } from 'node:fs/promises';
import { lerArquivoBweb } from './bweb/ler-arquivo.js';
import { lerAmostra } from './bweb/leitor.js';
import { armazenarOriginal, calcularSha256, concluirLote, falharLote, iniciarLote } from './lote.js';
import { chaveGrupo, persistirArquivo } from './persistir-bus.js';
import { criarValidador, encodingSuspeito } from './validacoes.js';

const REGISTROS_POR_BLOCO = 5000;
const GRUPOS_POR_BLOCO = 200;
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
      const ultimaLinha = new Map();
      let bloco = [];
      let registrosNoBloco = 0;
      const abertos = new Map();

      for await (const registro of arquivo.registros) {
        if (!primeiro) primeiro = registro;
        qtLinhas += 1;
        ultimaLinha.set(chaveGrupo(registro.valores), registro.nrLinha);
      }

      const contabilizar = (lista) => {
        for (const item of lista) {
          if (item.severidade === 'erro') qtErros += 1;
          else qtAlertas += 1;
          if (alertas.length < LIMITE_ALERTAS) alertas.push(item);
        }
      };

      const descarregar = async () => {
        if (bloco.length === 0) return;

        const registros = bloco.flat();
        bloco = [];
        registrosNoBloco = 0;

        const validado = validar
          ? validar(registros, { leiaute: arquivo.leiaute })
          : validador.validarGrupo(registros);

        contabilizar(validado.alertas ?? []);

        if (validado.registros.length === 0) return;

        const { importados: novos } = await persistir(trx, {
          loteId: lote.id,
          registros: validado.registros,
          metadadosDerivados: arquivo.metadadosDerivados?.campos ?? [],
        });
        importados += novos;
      };

      const leitura = await lerArquivo(caminho, { nomeArquivo });
      for await (const registro of leitura.registros) {
        const chave = chaveGrupo(registro.valores);
        let grupo = abertos.get(chave);
        if (!grupo) {
          grupo = [];
          abertos.set(chave, grupo);
        }
        grupo.push(registro);

        if (registro.nrLinha === ultimaLinha.get(chave)) {
          bloco.push(grupo);
          registrosNoBloco += grupo.length;
          abertos.delete(chave);

          if (
            registrosNoBloco >= REGISTROS_POR_BLOCO ||
            bloco.length >= GRUPOS_POR_BLOCO
          ) {
            await descarregar();
          }
        }
      }

      for (const grupo of abertos.values()) {
        bloco.push(grupo);
        registrosNoBloco += grupo.length;
      }
      abertos.clear();
      await descarregar();

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
