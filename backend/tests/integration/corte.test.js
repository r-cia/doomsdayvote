import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { aplicarFiltroCorte, avisosCorte, metadadosCorte, resolverCorte } from '../../src/modules/apuracao/corte.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import {
  NOME_2014_1T,
  NOME_2018,
  NOME_2026,
  escreverArquivo,
  gerarBweb2014,
  gerarBweb2018Multi,
  gerarBwebMulti,
  secoes2018,
  secoes2026,
} from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const SECOES = 8;
let diretorio;

async function importar(nome, conteudo) {
  const caminho = await escreverArquivo(diretorio, nome, conteudo);
  const resultado = await importarArquivo({ db, caminho, nomeArquivo: nome });
  await atualizarViews(db);
  return resultado;
}

async function eleicaoId(ano, turno) {
  const eleicao = await db
    .selectFrom('eleicao')
    .select('id')
    .where('ano_eleicao', '=', ano)
    .where('nr_turno', '=', turno)
    .executeTakeFirstOrThrow();
  return eleicao.id;
}

async function primeiroCargo(eid) {
  const cargo = await db
    .selectFrom('boletim_versao')
    .select('cd_cargo_pergunta')
    .where('eleicao_id', '=', eid)
    .where(sql`lower(ds_cargo_pergunta)`, 'in', ['presidente', 'governador'])
    .orderBy('cd_cargo_pergunta')
    .executeTakeFirstOrThrow();
  return cargo.cd_cargo_pergunta;
}

async function contarCorte(eid, cargo, corte) {
  const qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eid)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  const { total } = await aplicarFiltroCorte(qb, corte)
    .select(({ fn }) => fn.countAll().as('total'))
    .executeTakeFirstOrThrow();
  return Number(total);
}

function diaAnterior(data) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('corte temporal', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'bweb-corte-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it(
    'corta o dia de 2026 pelo recebimento e devolve metadados',
    async () => {
      await importar(NOME_2026, gerarBwebMulti(secoes2026(SECOES)));
      const eid = await eleicaoId(2026, 1);
      const cargo = await primeiroCargo(eid);
      const final = await contarCorte(eid, cargo, { tipo: 'final' });

      expect(final).toBe(SECOES);

      const { primeiro, ultimo } = await db
        .selectFrom('boletim_versao')
        .select(({ fn }) => [fn.min('dt_bu_recebido_ts').as('primeiro'), fn.max('dt_bu_recebido_ts').as('ultimo')])
        .where('eleicao_id', '=', eid)
        .where('cd_cargo_pergunta', '=', cargo)
        .where('ativo', '=', true)
        .where('cd_tipo_urna', '=', 1)
        .executeTakeFirstOrThrow();
      const asOf = (instante) => resolverCorte({ as_of: instante.toISOString() });

      expect(await contarCorte(eid, cargo, asOf(new Date(primeiro.getTime() - 1000)))).toBe(0);
      expect(await contarCorte(eid, cargo, asOf(primeiro))).toBeGreaterThanOrEqual(1);
      expect(await contarCorte(eid, cargo, asOf(primeiro))).toBeLessThan(final);
      expect(await contarCorte(eid, cargo, asOf(ultimo))).toBe(final);

      const metadados = await metadadosCorte(db, { eleicaoId: eid, cargo }, { tipo: 'final' });
      expect(metadados.lotes).toHaveLength(1);
      expect(metadados.source_updated_at).toBeTruthy();
      expect(metadados.captured_at).toBeTruthy();

      const daUf = await metadadosCorte(db, { eleicaoId: eid, cargo, escopo: { sgUf: 'AC' } }, { tipo: 'final' });
      expect(daUf.lotes).toEqual(metadados.lotes);
      const deOutraUf = await metadadosCorte(db, { eleicaoId: eid, cargo, escopo: { sgUf: 'SP' } }, { tipo: 'final' });
      expect(deOutraUf).toEqual({ source_updated_at: null, captured_at: null, lotes: [] });
      const antes = await metadadosCorte(db, { eleicaoId: eid, cargo }, asOf(new Date(primeiro.getTime() - 1000)));
      expect(antes.lotes).toEqual([]);
      const noPrimeiro = await metadadosCorte(db, { eleicaoId: eid, cargo }, asOf(primeiro));
      expect(noPrimeiro.lotes).toEqual(metadados.lotes);

      const avisos = await avisosCorte(db, { eleicaoId: eid, cargo }, { tipo: 'final' });
      expect(avisos.map((a) => a.codigo)).not.toContain('CORTE_INDISPONIVEL');
    },
    { timeout: 120000 },
  );

  it(
    '2014 só aceita corte por dia e avisa que o horário é indisponível',
    async () => {
      await importar(NOME_2014_1T, gerarBweb2014());
      const eid = await eleicaoId(2014, 1);
      const cargo = await primeiroCargo(eid);
      const final = await contarCorte(eid, cargo, { tipo: 'final' });
      const corteHorario = resolverCorte({ as_of: '2014-10-05T12:00:00-03:00' });

      expect(await contarCorte(eid, cargo, corteHorario)).toBe(0);
      const avisos = await avisosCorte(db, { eleicaoId: eid, cargo }, corteHorario);
      expect(avisos.map((a) => a.codigo)).toEqual(
        expect.arrayContaining(['CORTE_INDISPONIVEL', 'METADADOS_DERIVADOS']),
      );

      const { min, max } = await db
        .selectFrom('boletim_versao')
        .select(({ fn }) => [fn.min('dt_bu_recebido_data').as('min'), fn.max('dt_bu_recebido_data').as('max')])
        .where('eleicao_id', '=', eid)
        .where('cd_cargo_pergunta', '=', cargo)
        .executeTakeFirstOrThrow();

      expect(await contarCorte(eid, cargo, resolverCorte({ as_of_date: diaAnterior(min) }))).toBe(0);
      expect(await contarCorte(eid, cargo, resolverCorte({ as_of_date: max }))).toBe(final);
    },
    { timeout: 120000 },
  );

  it(
    '2018 não tem ordem de recebimento e não entra em corte temporal',
    async () => {
      await importar(NOME_2018, gerarBweb2018Multi(secoes2018(SECOES)));
      const eid = await eleicaoId(2018, 2);
      const cargo = await primeiroCargo(eid);
      const final = await contarCorte(eid, cargo, { tipo: 'final' });
      const corte = resolverCorte({ as_of: '2018-10-30T12:00:00-03:00' });

      expect(final).toBe(SECOES);
      expect(await contarCorte(eid, cargo, corte)).toBe(0);
      expect(await contarCorte(eid, cargo, resolverCorte({ as_of_date: '2018-10-30' }))).toBe(0);

      const avisos = await avisosCorte(db, { eleicaoId: eid, cargo }, corte);
      expect(avisos.map((a) => a.codigo)).toContain('CORTE_INDISPONIVEL');
    },
    { timeout: 120000 },
  );
});
