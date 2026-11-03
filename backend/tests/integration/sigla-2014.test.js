import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { somarVotos } from '../../src/modules/apuracao/totais.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { CENARIO, NOME_2014_1T, escreverArquivo, gerarBweb2014 } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
let diretorio;
let alvo;

describe('sigla do partido em 2014 sem sg_partido', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-sigla-2014-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    const caminho = await escreverArquivo(diretorio, NOME_2014_1T, gerarBweb2014());
    await importarArquivo({ db, caminho, nomeArquivo: NOME_2014_1T });
    await sql`update resultado_votavel set sg_partido = null where ano_eleicao = 2014`.execute(db);
    await atualizarViews();
    const linha = await db
      .selectFrom('boletim_versao')
      .select(['eleicao_id', 'cd_cargo_pergunta'])
      .where('cd_cargo_pergunta', '=', 1)
      .executeTakeFirstOrThrow();
    alvo = { eleicaoId: linha.eleicao_id, cargo: linha.cd_cargo_pergunta };
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it(
    'lê a sigla de nm_partido no corte final (view), no escopo por UF (tabela) e na seção',
    async () => {
      const nominais = (votos) => votos.filter((voto) => voto.categoria === 'nominal' && voto.nm_partido);

      const final = nominais(await somarVotos(db, { ...alvo, corte: { tipo: 'final' } }));
      expect(final.length).toBeGreaterThan(0);
      for (const voto of final) expect(voto.sg_partido).toBe(voto.nm_partido);

      const porUf = nominais(await somarVotos(db, { ...alvo, corte: { tipo: 'final' }, escopo: { sgUf: CENARIO.uf } }));
      expect(porUf.length).toBeGreaterThan(0);
      for (const voto of porUf) expect(voto.sg_partido).toBe(voto.nm_partido);

      const { rows } = await sql`
        select
          (select count(*)::int from mv_votos_final where eleicao_id = ${alvo.eleicaoId} and nm_partido is not null and sg_partido is null) as votos_final,
          (select count(*)::int from mv_totais_area where eleicao_id = ${alvo.eleicaoId} and nm_partido is not null and sg_partido is null) as totais_area,
          (select count(*)::int from mv_secao_candidato_final where eleicao_id = ${alvo.eleicaoId} and categoria = 'nominal' and sg_partido is null) as secao_candidato
      `.execute(db);
      expect(rows[0]).toEqual({ votos_final: 0, totais_area: 0, secao_candidato: 0 });
    },
    { timeout: 120000 },
  );
});
