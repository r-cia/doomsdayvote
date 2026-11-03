import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { criarDb } from '../db/index.js';
import { loadTotalizacaoEnv } from '../env.js';
import { registrarEventoCarga } from '../lib/log-carga.js';
import { carregarZip } from '../modules/totalizacao/carga.js';

function lerArgumentos(argv) {
  const opcoes = { pasta: null, arquivo: null, falharRapido: false };
  for (let indice = 0; indice < argv.length; indice += 1) {
    if (argv[indice] === '--pasta') opcoes.pasta = argv[indice + 1];
    else if (argv[indice] === '--arquivo') opcoes.arquivo = argv[indice + 1];
    else if (argv[indice] === '--falhar-rapido') opcoes.falharRapido = true;
  }
  return opcoes;
}

function segundos(inicio) {
  return Math.round((Date.now() - inicio) / 1000);
}

async function main() {
  let env;
  try {
    env = loadTotalizacaoEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const { pasta, arquivo, falharRapido } = lerArgumentos(process.argv.slice(2));
  if (!pasta) {
    console.error(
      'uso: npm run totalizacao:carregar -- --pasta <diretório> [--arquivo <nome.zip|nome.7z>] [--falhar-rapido]',
    );
    process.exit(1);
  }

  const db = criarDb({
    connectionString: env.DATABASE_URL,
    statementTimeout: 0,
    poolMax: env.DB_POOL_MAX,
    workMemMb: env.DB_WORK_MEM_MB,
  });

  try {
    const resumo = {
      arquivos: 0,
      secoes: 0,
      votos_bu: 0,
      votos_rdv: 0,
      ignorados_sha256: 0,
      parciais: 0,
      falhas: 0,
    };
    const inicioCarga = Date.now();
    const nomes = arquivo
      ? [arquivo]
      : (await readdir(pasta, { withFileTypes: true }))
          .filter((entrada) => entrada.isFile() && /\.(zip|7z)$/i.test(entrada.name))
          .map((entrada) => entrada.name)
          .sort();
    resumo.arquivos = nomes.length;
    registrarEventoCarga('carga_iniciada', { arquivos: nomes.length });

    for (const nome of nomes) {
      const inicio = Date.now();
      try {
        const resultado = await carregarZip(db, path.join(pasta, nome), {
          falharRapido,
          aoProgredir: ({ etapa, atual, total }) => {
            if (etapa === 'secao' && (atual % 100 === 0 || atual === total)) {
              console.log(`${nome}: ${atual}/${total} seções (${segundos(inicio)}s)`);
            }
          },
        });

        if (resultado.ignorado) {
          resumo.ignorados_sha256 += 1;
          console.log(`${nome}: ignorado (${resultado.motivo})`);
          continue;
        }

        if (resultado.status === 'parcial') resumo.parciais += 1;
        resumo.secoes += resultado.secoes;
        resumo.votos_bu += resultado.votos_bu;
        resumo.votos_rdv += resultado.votos_rdv;
        console.log(
          `${nome}: ${resultado.status}, ${resultado.secoes} seção(ões), ` +
            `${resultado.secoes_com_erro} com erro, ${resultado.votos_bu} votos BU, ` +
            `${resultado.votos_rdv} votos RDV, ${resultado.arquivos_ignorados} arquivo(s) ignorado(s) ` +
            `em ${segundos(inicio)}s`,
        );
      } catch (erro) {
        resumo.falhas += 1;
        console.error(`${nome}: ${erro.message}`);
      }
    }

    registrarEventoCarga('carga_concluida', {
      arquivos: resumo.arquivos,
      secoes: resumo.secoes,
      votos_bu: resumo.votos_bu,
      votos_rdv: resumo.votos_rdv,
      ignorados: resumo.ignorados_sha256,
      parciais: resumo.parciais,
      falhas: resumo.falhas,
      duracao_ms: Date.now() - inicioCarga,
    });
    console.log(JSON.stringify(resumo, null, 2));
    process.exitCode = resumo.falhas > 0 || resumo.parciais > 0 ? 1 : 0;
  } finally {
    await db.destroy();
  }
}

main();
