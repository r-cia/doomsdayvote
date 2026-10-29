import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { importarArquivo } from './importar-arquivo.js';
import { gerarRelatorioLote } from './relatorio.js';

const EXTENSOES = /\.(csv|txt)(\.gz)?$/i;

export async function carregarPasta({ db, inputDir, storageDir, now = new Date() }) {
  const entradas = await readdir(inputDir, { withFileTypes: true });
  const arquivos = entradas
    .filter((entrada) => entrada.isFile() && EXTENSOES.test(entrada.name))
    .map((entrada) => entrada.name)
    .sort();
  const ignoradosExtensao = entradas
    .filter((entrada) => entrada.isFile() && !EXTENSOES.test(entrada.name))
    .map((entrada) => entrada.name)
    .sort();

  const resumo = {
    arquivos: arquivos.length,
    importados: 0,
    ignorados: 0,
    falhas: 0,
    ignorados_extensao: ignoradosExtensao,
    lotes: [],
  };

  const relatoriosDir = path.join(storageDir, 'relatorios');
  await mkdir(relatoriosDir, { recursive: true });

  for (const nome of arquivos) {
    try {
      const resultado = await importarArquivo({
        db,
        caminho: path.join(inputDir, nome),
        nomeArquivo: nome,
        storageDir,
        now,
      });

      if (resultado.ignorado) {
        resumo.ignorados += 1;
        resumo.lotes.push({ arquivo: nome, lote_id: resultado.lote.id, status: 'ignorado_repetido' });
        continue;
      }

      const relatorio = await gerarRelatorioLote(db, resultado.lote.id);
      await writeFile(
        path.join(relatoriosDir, `${resultado.lote.id}.json`),
        JSON.stringify(relatorio, null, 2),
      );

      resumo.importados += 1;
      resumo.lotes.push({
        arquivo: nome,
        lote_id: resultado.lote.id,
        status: 'concluido',
        leiaute: resultado.lote.leiaute,
        linhas: resultado.lote.qt_linhas,
        importadas: resultado.lote.qt_linhas_importadas,
        erros: resultado.lote.qt_erros,
        alertas: resultado.lote.qt_alertas,
      });
    } catch (erro) {
      resumo.falhas += 1;
      resumo.lotes.push({
        arquivo: nome,
        status: 'falhou',
        erro: erro.codigo ?? 'ERRO_INTERNO',
        mensagem: erro.message,
      });
    }
  }

  return resumo;
}
