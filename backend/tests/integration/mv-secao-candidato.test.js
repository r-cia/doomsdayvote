import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { comparacaoLocal } from '../../src/modules/analise/comparacao-local.js';
import { concentracao } from '../../src/modules/analise/concentracao.js';
import { estatisticasDaEleicao } from '../../src/modules/analise/descritivas.js';
import { duplicacaoPorAssinatura } from '../../src/modules/analise/duplicacao.js';
import { baseSecaoCandidato } from '../../src/modules/analise/estatisticas.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import {
  NOME_2014_1T,
  NOME_2018,
  NOME_2026,
  escreverArquivo,
  gerarBweb2014Multi,
  gerarBweb2018Multi,
  gerarBwebMulti,
  secoes2014,
  secoes2018,
  secoes2026,
} from '../helpers/fixtures.js';
import {
  baseSecaoCandidatoPelasTabelas,
  candidatosPelasTabelas,
  comparacaoLocalPelasTabelas,
  concentracaoPelasTabelas,
  duplicacaoPelasTabelas,
} from '../helpers/cortes-por-tabelas.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const FUSO = 'America/Sao_Paulo';
const SECOES = 12;

// A ordem de soma de ponto flutuante muda entre as duas leituras.
const arredondar = (valor) =>
  JSON.parse(JSON.stringify(valor, (_, item) => (typeof item === 'number' ? Number(item.toPrecision(9)) : item)));

const porTexto = (chave) => (a, b) => String(chave(a)).localeCompare(String(chave(b)));

// As duas leituras não garantem a mesma ordem de linhas; compara os conjuntos.
function ordenarListas(valor) {
  if (Array.isArray(valor)) {
    const itens = valor.map(ordenarListas);
    const chave = (item) => item?.nr_votavel ?? item?.secao?.id ?? item?.id ?? item?.assinatura ?? `${item?.nivel}|${item?.chave}`;
    return itens.every((item) => item && typeof item === 'object') ? itens.sort(porTexto(chave)) : itens;
  }
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([campo, item]) => [campo, ordenarListas(item)]));
  }
  return valor;
}

const normalizar = (valor) => arredondar(ordenarListas(valor));

const CAMPOS_BASE = [
  'secao_id', 'sg_uf', 'cd_municipio_tse', 'nm_municipio', 'nr_zona', 'nr_secao', 'qt_aptos',
  'qt_comparecimento', 'qt_abstencoes', 'qt_biom', 'dt_bu_recebido_ts', 'nr_votavel', 'nm_votavel', 'sg_partido', 'votos',
];

const reduzirBase = (linhas) =>
  [...linhas]
    .map((linha) => Object.fromEntries(CAMPOS_BASE.map((campo) => [campo, campo === 'votos' ? Number(linha[campo]) : linha[campo]])))
    .sort((a, b) => String(a.secao_id).localeCompare(String(b.secao_id)) || a.nr_votavel - b.nr_votavel);

const reduzirCandidatos = (candidatos) =>
  candidatos.map((linha) => ({
    nr_votavel: linha.nr_votavel,
    nm_votavel: linha.nm_votavel,
    sg_partido: linha.sg_partido,
    secoes: Number(linha.secoes),
    secoes_com_voto: Number(linha.secoes_com_voto ?? 0),
    media: linha.media === null ? null : Number(linha.media),
    mediana: linha.mediana === null ? null : Number(linha.mediana),
    desvio: linha.desvio === null ? null : Number(linha.desvio),
  }));

async function cortesDoCenario() {
  const { rows } = await sql`
    select
      percentile_disc(0.5) within group (order by dt_bu_recebido_ts) as instante,
      percentile_disc(0.5) within group (order by coalesce(((dt_bu_recebido_ts at time zone ${FUSO})::date)::text, dt_bu_recebido_data::text)) as data
    from boletim_versao
    where ativo
  `.execute(db);
  const instante = rows[0].instante ?? new Date('2026-10-04T20:00:00Z');
  const data = rows[0].data ?? '2026-10-04';
  return [
    ['final', { tipo: 'final' }],
    ['intradiário no meio', { tipo: 'recebimento_intradiario', instante }],
    ['intradiário depois de tudo', { tipo: 'recebimento_intradiario', instante: new Date('2030-01-01T00:00:00Z') }],
    ['diário no meio', { tipo: 'recebimento_diario', data }],
    ['diário depois de tudo', { tipo: 'recebimento_diario', data: '2030-01-01' }],
  ];
}

afterAll(async () => {
  await db.destroy();
});

describe.each([
  ['2014', NOME_2014_1T, () => gerarBweb2014Multi(secoes2014(SECOES))],
  ['2018', NOME_2018, () => gerarBweb2018Multi(secoes2018(SECOES))],
  ['2026', NOME_2026, () => gerarBwebMulti(secoes2026(SECOES))],
])('cortes lidos da view materializada equivalem às tabelas (%s)', (ano, nome, conteudo) => {
  let diretorio;
  let alvo;
  let eleicao;
  let cortes;

  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-mv-'));
    await limparBanco(db);
    const caminho = await escreverArquivo(diretorio, nome, conteudo());
    await importarArquivo({ db, caminho, nomeArquivo: nome });
    await atualizarViews();
    const linha = await db
      .selectFrom('boletim_versao as bv')
      .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
      .select(['bv.eleicao_id', 'bv.cd_cargo_pergunta', 'e.ano_eleicao', 'e.nr_turno'])
      .where(sql`lower(bv.ds_cargo_pergunta)`, '=', 'presidente')
      .executeTakeFirstOrThrow();
    alvo = { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
    eleicao = { id: linha.eleicao_id, ano_eleicao: linha.ano_eleicao, nr_turno: linha.nr_turno };
    cortes = await cortesDoCenario();
  }, 120000);

  afterAll(async () => {
    await limparBanco(db);
    await rm(diretorio, { recursive: true, force: true });
  });

  it('concentração', async () => {
    for (const [, corte] of cortes) {
      const pelaMv = await concentracao(db, { ...alvo, corte, limite: 100000 });
      const pelasTabelas = await concentracaoPelasTabelas(db, { ...alvo, corte, limite: 100000 });
      expect(pelaMv.cobertura).toEqual(pelasTabelas.cobertura);
      expect(pelaMv.total).toBe(pelasTabelas.total);
      expect(normalizar(pelaMv)).toEqual(normalizar(pelasTabelas));
    }
  }, 120000);

  it('comparação local', async () => {
    for (const [, corte] of cortes) {
      const pelaMv = await comparacaoLocal(db, { ...alvo, corte });
      const pelasTabelas = await comparacaoLocalPelasTabelas(db, { ...alvo, corte });
      expect(normalizar(pelaMv)).toEqual(normalizar(pelasTabelas));
    }
  }, 120000);

  it('duplicação por assinatura', async () => {
    for (const [, corte] of cortes) {
      const pelaMv = await duplicacaoPorAssinatura(db, { ...alvo, corte, limite: 1000 });
      const pelasTabelas = await duplicacaoPelasTabelas(db, { ...alvo, corte, limite: 1000 });
      expect(pelaMv.total_secoes_escopo).toBe(pelasTabelas.total_secoes_escopo);
      expect(pelaMv.total_grupos).toBe(pelasTabelas.total_grupos);
      expect(pelaMv.total_secoes).toBe(pelasTabelas.total_secoes);
      expect(normalizar(pelaMv.grupos)).toEqual(normalizar(pelasTabelas.grupos));
    }
  }, 120000);

  it('base seção × candidato (anomalias, Benford, isolamento)', async () => {
    for (const [, corte] of cortes) {
      for (const escopo of [{}, { sgUf: 'AC' }, { sgUf: 'SP' }]) {
        const pelaMv = reduzirBase(await baseSecaoCandidato(db, { ...alvo, corte, escopo }));
        const pelasTabelas = reduzirBase(await baseSecaoCandidatoPelasTabelas(db, { ...alvo, corte, escopo }));
        expect(pelaMv).toEqual(pelasTabelas);
      }
    }
  }, 120000);

  it('estatística descritiva por candidato', async () => {
    for (const [, corte] of cortes) {
      const pelaMv = await estatisticasDaEleicao(db, { eleicao, cargo: alvo.cargo, corte });
      const pelasTabelas = await candidatosPelasTabelas(db, { ...alvo, corte, escopo: {} }, eleicao);
      expect(arredondar(reduzirCandidatos(pelaMv.candidatos))).toEqual(arredondar(reduzirCandidatos(pelasTabelas)));
    }
  }, 120000);

  it('o corte depois de tudo devolve o mesmo que o final, e o do meio nunca devolve mais seções', async () => {
    const [[, final], , [, tarde], [, diarioMeio], [, diarioTarde]] = cortes;
    const total = async (corte) => (await duplicacaoPorAssinatura(db, { ...alvo, corte, limite: 1 })).total_secoes_escopo;
    const secoesFinal = await total(final);
    expect(secoesFinal).toBeGreaterThan(0);
    for (const corte of [tarde, diarioTarde]) {
      const secoes = await total(corte);
      if (secoes > 0) expect(secoes).toBe(secoesFinal);
    }
    const meio = await total(diarioMeio);
    expect(meio).toBeLessThanOrEqual(secoesFinal);
    if (ano === '2026') {
      const intradiario = await total(cortes[1][1]);
      expect(intradiario).toBeGreaterThan(0);
      expect(intradiario).toBeLessThan(secoesFinal);
    }
  }, 120000);
});
