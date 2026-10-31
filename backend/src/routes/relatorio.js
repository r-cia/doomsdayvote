import { resolverCorte } from '../modules/apuracao/corte.js';
import { relatorioDaEleicao } from '../modules/analise/relatorio.js';
import { lerOrdenacao, ordenacaoSchema, ordenarLista } from '../lib/ordenacao.js';
import { baseSchema, buscarEleicao, escopoDe } from './comum.js';

const diferencaPct = (valor, base) => (valor === null || valor === undefined || base === null || base === undefined ? null : valor - base);

const colunasRelatorio = (alvo) => ({
  referencia: (r) => r.ano_eleicao * 10 + r.nr_turno,
  bus: (r) => r.bus,
  participacao_pct: (r) => r.participacao_pct,
  diferenca_participacao: (r) => diferencaPct(r.participacao_pct, alvo?.participacao_pct),
  abstencao_pct: (r) => r.abstencao_pct,
  diferenca_abstencao: (r) => diferencaPct(r.abstencao_pct, alvo?.abstencao_pct),
  data_hora: (r) => r.recebimento.data_hora,
  somente_data: (r) => r.recebimento.somente_data,
  ausente: (r) => r.recebimento.ausente,
  outra_precisao: (r) => r.recebimento.outra_precisao,
  sem_encerramento: (r) => r.recebimento.sem_encerramento,
  antes_encerramento: (r) => r.recebimento.antes_encerramento,
  antes_emissao: (r) => r.recebimento.antes_emissao,
  mediana_atraso_min: (r) => r.recebimento.mediana_atraso_min,
  p90_atraso_min: (r) => r.recebimento.p90_atraso_min,
});

export function registrarRelatorio({ app, db, cacheado }) {
  app.get('/api/relatorio', cacheado('relatorio', 300, baseSchema.extend(ordenacaoSchema(Object.keys(colunasRelatorio()))), async (query) => {
    const eleicao = await buscarEleicao(db, query.election_id);
    const corte = resolverCorte(query);

    const { alvo, referencias } = await relatorioDaEleicao(db, {
      eleicao,
      cargo: query.cargo,
      corte,
      escopo: escopoDe(query),
    });

    return {
      alvo,
      comparacao_final_disponivel: corte.tipo === 'final',
      referencias: ordenarLista(referencias, colunasRelatorio(alvo), lerOrdenacao(query)),
    };
  }));
}
