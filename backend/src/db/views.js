const VIEWS_MATERIALIZADAS = ['mv_votos_final', 'mv_metricas_final', 'mv_totais_area', 'mv_secao_candidato_final'];

export async function atualizarViewsMaterializadas(executar) {
  for (const view of VIEWS_MATERIALIZADAS) {
    await executar(`refresh materialized view concurrently ${view}`).catch(() =>
      executar(`refresh materialized view ${view}`),
    );
  }
}
