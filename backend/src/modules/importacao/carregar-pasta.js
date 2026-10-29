import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { importarArquivo } from './importar-arquivo.js';
import { gerarRelatorioLote } from './relatorio.js';

const EXTENSOES = /\.(csv|txt)(\.gz)?$/i;

function carimbo(data = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(data.getDate())}-${p(data.getMonth() + 1)}-${data.getFullYear()} ${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`;
}

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

  for (const [indice, nome] of arquivos.entries()) {
    const inicio = Date.now();
    const decorrido = () => Math.round((Date.now() - inicio) / 1000);
    const prefixo = () => `${carimbo()} [${indice + 1}/${arquivos.length}] ${nome}`;
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
        console.error(`${prefixo()} ignorado_repetido em ${decorrido()}s`);
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
      console.error(
        `${prefixo()} concluido em ${decorrido()}s | leiaute=${resultado.lote.leiaute} linhas=${resultado.lote.qt_linhas} importadas=${resultado.lote.qt_linhas_importadas} erros=${resultado.lote.qt_erros} alertas=${resultado.lote.qt_alertas}`,
      );
    } catch (erro) {
      resumo.falhas += 1;
      resumo.lotes.push({
        arquivo: nome,
        status: 'falhou',
        erro: erro.codigo ?? 'ERRO_INTERNO',
        mensagem: erro.message,
      });
      console.error(
        `${prefixo()} FALHOU em ${decorrido()}s | ${erro.codigo ?? 'ERRO_INTERNO'}: ${erro.message}`,
      );
    }
  }

  return resumo;
}
