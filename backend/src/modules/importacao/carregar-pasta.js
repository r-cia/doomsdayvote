import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { registrarEventoCarga } from '../../lib/log-carga.js';
import { importarArquivo } from './importar-arquivo.js';

const EXTENSOES = /\.(csv|txt)(\.gz|\.7z)?$/i;

function carimbo(data = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(data.getDate())}-${p(data.getMonth() + 1)}-${data.getFullYear()} ${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`;
}

export async function carregarPasta({
  db,
  inputDir,
  arquivo = null,
  now = new Date(),
  registrarEvento = registrarEventoCarga,
}) {
  const entradas = await readdir(inputDir, { withFileTypes: true });
  const arquivos = arquivo
    ? [arquivo]
    : entradas
        .filter((entrada) => entrada.isFile() && EXTENSOES.test(entrada.name))
        .map((entrada) => entrada.name)
        .sort();
  const ignoradosExtensao = arquivo
    ? []
    : entradas
        .filter((entrada) => entrada.isFile() && !EXTENSOES.test(entrada.name))
        .map((entrada) => entrada.name)
        .sort();

  const resumo = {
    arquivos: arquivos.length,
    importados: 0,
    ignorados: 0,
    falhas: 0,
    linhas_ignoradas_fora_de_escopo: 0,
    ignorados_extensao: ignoradosExtensao,
    lotes: [],
  };

  registrarEvento('carga_iniciada', { arquivos: arquivos.length });

  for (const [indice, nome] of arquivos.entries()) {
    const inicio = Date.now();
    const decorrido = () => Math.round((Date.now() - inicio) / 1000);
    const prefixo = () => `${carimbo()} [${indice + 1}/${arquivos.length}] ${nome}`;
    try {
      const resultado = await importarArquivo({
        db,
        caminho: path.join(inputDir, nome),
        nomeArquivo: nome,
        now,
        registrarEvento,
      });

      if (resultado.ignorado) {
        resumo.ignorados += 1;
        resumo.lotes.push({ arquivo: nome, lote_id: resultado.lote.id, status: 'ignorado_repetido' });
        registrarEvento('lote_ignorado', {
          arquivo: nome,
          lote_id: resultado.lote.id,
          motivo: 'repetido',
          status: resultado.lote.status,
        });
        console.error(`${prefixo()} ignorado_repetido em ${decorrido()}s`);
        continue;
      }

      resumo.importados += 1;
      resumo.linhas_ignoradas_fora_de_escopo += resultado.qtLinhasIgnoradas;
      resumo.lotes.push({
        arquivo: nome,
        lote_id: resultado.lote.id,
        status: 'concluido',
        leiaute: resultado.lote.leiaute,
        linhas: resultado.lote.qt_linhas,
        importadas: resultado.lote.qt_linhas_importadas,
        erros: resultado.lote.qt_erros,
        alertas: resultado.lote.qt_alertas,
        linhas_ignoradas_fora_de_escopo: resultado.qtLinhasIgnoradas,
      });
      console.error(
        `${prefixo()} concluido em ${decorrido()}s | leiaute=${resultado.lote.leiaute} linhas=${resultado.lote.qt_linhas} importadas=${resultado.lote.qt_linhas_importadas} ignoradas_fora_de_escopo=${resultado.qtLinhasIgnoradas} erros=${resultado.lote.qt_erros} alertas=${resultado.lote.qt_alertas}`,
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

  registrarEvento('carga_concluida', {
    arquivos: resumo.arquivos,
    importados: resumo.importados,
    ignorados: resumo.ignorados,
    falhas: resumo.falhas,
  });

  return resumo;
}
