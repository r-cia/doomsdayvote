import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { criarDb } from '../../src/db/index.js';
import { expandirSecao, secoesCompactas } from '../../src/modules/analise/mv-secao-candidato.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });

let storageDir;
let alvo;

function agruparPorSecao(linhas) {
  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) porSecao.set(linha.secao_id, []);
    porSecao.get(linha.secao_id).push(linha);
  }
  return porSecao;
}

function linhasAntigas(escopo = {}, categorias = null) {
  let consulta = db
    .selectFrom('mv_secao_candidato_final')
    .selectAll()
    .where('eleicao_id', '=', alvo.eleicaoId)
    .where('cargo', '=', alvo.cargo);
  if (categorias) consulta = consulta.where('categoria', 'in', categorias);
  if (escopo.sgUf) consulta = consulta.where('sg_uf', '=', escopo.sgUf);
  return consulta.execute();
}

const normalizar = (linha) => ({
  ...linha,
  votos: Number(linha.votos),
  validos: Number(linha.validos),
  qt_aptos: linha.qt_aptos === null ? null : Number(linha.qt_aptos),
});

const porVotavel = (a, b) => a.cd_tipo_votavel - b.cd_tipo_votavel || a.nr_votavel - b.nr_votavel;

describe('seções compactas equivalem à leitura seção × votável da view', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-mv-compacto-'));
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

  for (const [descricao, escopo, categorias] of [
    ['todas as categorias', {}, null],
    ['nominal', {}, ['nominal']],
    ['nominal e legenda', {}, ['nominal', 'legenda']],
    ['escopo por UF', { sgUf: 'AC' }, null],
    ['escopo de outra UF', { sgUf: 'SP' }, null],
  ]) {
    it(descricao, async () => {
      const antigas = agruparPorSecao(await linhasAntigas(escopo, categorias));
      const { secoes, votaveis } = await secoesCompactas(db, { ...alvo, escopo, categorias });

      expect(secoes.length).toBe(antigas.size);
      expect(secoes.map((secao) => secao.secao_id)).toEqual([...secoes.map((secao) => secao.secao_id)].sort());
      for (const secao of secoes) {
        const esperado = [...antigas.get(secao.secao_id)].sort(porVotavel).map(normalizar);
        const obtido = expandirSecao(secao, votaveis).map(normalizar);
        expect(obtido).toEqual(esperado.map((linha) => {
          const { eleicao_id, cargo, ...resto } = linha;
          return resto;
        }));
      }
    });
  }

  it('uma seção sem votos em um dos votáveis e nomes ausentes mantêm os valores por seção', async () => {
    const { secoes, votaveis } = await secoesCompactas(db, { ...alvo });
    expect(votaveis.length).toBeGreaterThan(0);
    for (const secao of secoes) {
      expect(secao.nrs).toHaveLength(secao.votos.length);
      expect(secao.refs.every((ref) => ref >= 0 && ref < votaveis.length)).toBe(true);
    }
  });
});
