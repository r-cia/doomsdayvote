import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { comparacaoLocal } from '../../src/modules/analise/comparacao-local.js';
import { concentracao } from '../../src/modules/analise/concentracao.js';
import { duplicacaoPorAssinatura } from '../../src/modules/analise/duplicacao.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const FINAL = { tipo: 'final' };
// Mesmo conjunto do corte final (todos os BUs do fixture têm recebimento com hora), mas lido das tabelas.
const POR_TABELAS = { tipo: 'recebimento_intradiario', instante: new Date('2030-01-01T00:00:00Z') };

let storageDir;
let alvo;

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

const normalizarGrupos = (grupos) => ordenarListas(grupos);

describe('corte final lido da view materializada equivale às tabelas', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-mv-'));
    await limparBanco(db);
    const nome = 'bweb-1t_ac_2026.csv';
    await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
    await atualizarViews();
    const linha = await db
      .selectFrom('boletim_versao')
      .select(['eleicao_id', 'cd_cargo_pergunta'])
      .where('ds_cargo_pergunta', '=', 'Presidente')
      .executeTakeFirstOrThrow();
    alvo = { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
  }, 120000);

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('concentração', async () => {
    const limite = 100;
    const pelaMv = await concentracao(db, { ...alvo, corte: FINAL, limite });
    const pelasTabelas = await concentracao(db, { ...alvo, corte: POR_TABELAS, limite });
    expect(pelaMv.cobertura.consideradas).toBeGreaterThan(0);
    expect(pelaMv.cobertura).toEqual(pelasTabelas.cobertura);
    expect(pelaMv.total).toBe(pelasTabelas.total);
    const chave = (item) => item.secao.id;
    expect(pelaMv.top_margem.map((item) => item.margem_absoluta)).toEqual(
      pelasTabelas.top_margem.map((item) => item.margem_absoluta),
    );
    const todas = await Promise.all(
      [FINAL, POR_TABELAS].map((corte) => concentracao(db, { ...alvo, corte, limite: 100000 })),
    );
    const [a, b] = todas.map((resultado) => [...resultado.top_share].sort(porTexto(chave)));
    expect(arredondar(ordenarListas(a))).toEqual(arredondar(ordenarListas(b)));
  }, 120000);

  it('comparação local', async () => {
    const pelaMv = await comparacaoLocal(db, { ...alvo, corte: FINAL });
    const pelasTabelas = await comparacaoLocal(db, { ...alvo, corte: POR_TABELAS });
    expect(pelaMv.grupos.length).toBeGreaterThan(0);
    expect(arredondar(normalizarGrupos(pelaMv.grupos))).toEqual(arredondar(normalizarGrupos(pelasTabelas.grupos)));
  }, 120000);

  it('duplicação por assinatura', async () => {
    const pelaMv = await duplicacaoPorAssinatura(db, { ...alvo, corte: FINAL, limite: 1000 });
    const pelasTabelas = await duplicacaoPorAssinatura(db, { ...alvo, corte: POR_TABELAS, limite: 1000 });
    expect(pelaMv.total_secoes_escopo).toBeGreaterThan(0);
    expect(pelaMv.total_grupos).toBe(pelasTabelas.total_grupos);
    expect(pelaMv.total_secoes).toBe(pelasTabelas.total_secoes);
    expect(pelaMv.total_secoes_escopo).toBe(pelasTabelas.total_secoes_escopo);
    expect(arredondar(normalizarGrupos(pelaMv.grupos))).toEqual(arredondar(normalizarGrupos(pelasTabelas.grupos)));
  }, 120000);
});
