import { loadApiEnv } from './env.js';
import { criarDependencias } from './composition-root.js';
import { buildApp } from './app.js';
import { migracoesPendentes } from './db/migracoes.js';

async function main() {
  let env;
  try {
    env = loadApiEnv();
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }

  const deps = criarDependencias(env);

  try {
    const pendentes = await migracoesPendentes(deps.db);
    if (pendentes.length > 0) {
      deps.logger.error({ migracoes: pendentes }, 'MIGRACOES_PENDENTES');
      await deps.db.destroy();
      process.exit(1);
    }

    const app = buildApp({ deps, config: env });
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (erro) {
    deps.logger.error({ err: erro }, 'falha_ao_iniciar');
    await deps.db.destroy();
    process.exit(1);
  }
}

main();
