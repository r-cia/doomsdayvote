import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { registrarRotas } from '../../src/routes/index.js';
import { limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 200, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

let storageDir;
let base;
let bus;

async function importar(nome) {
  await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
}

async function carregarAlvo() {
  const linhas = await db
    .selectFrom('boletim_versao')
    .select(['id', 'secao_id', 'eleicao_id', 'cd_cargo_pergunta'])
    .where('ds_cargo_pergunta', '=', 'Presidente')
    .where('ativo', '=', true)
    .where('cd_tipo_urna', '=', 1)
    .orderBy('id')
    .execute();
  base = `election_id=${linhas[0].eleicao_id}&cargo=${linhas[0].cd_cargo_pergunta}`;
  bus = linhas;
}

async function itens(parametros = '') {
  const resposta = await app.inject({ method: 'GET', url: `/api/sections?${base}&page_size=200${parametros}` });
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

async function itemDaSecao(secaoId, parametros = '') {
  const secao = await db
    .selectFrom('secao_eleitoral')
    .select(['nr_zona', 'nr_secao'])
    .where('id', '=', secaoId)
    .executeTakeFirstOrThrow();
  const { items } = await itens(`&zona=${secao.nr_zona}&secao=${secao.nr_secao}${parametros}`);
  return items.find((item) => item.id === secaoId);
}

async function totalComStatus(status, parametros = '') {
  const resposta = await app.inject({
    method: 'GET',
    url: `/api/sections?${base}&page_size=1&status=${status}${parametros}`,
  });
  expect(resposta.statusCode).toBe(200);
  return resposta.json().total;
}

describe('status e motivo calculados em SQL', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-status-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  describe('2026 (recebimento com hora)', () => {
    beforeEach(async () => {
      await importar('bweb-1t_ac_2026.csv');
      await carregarAlvo();
    });

    it('tipos de urna 2 a 5 e tipo ausente', async () => {
      const esperado = [
        [2, 'nao_apurada', null],
        [3, 'anulada_apurada_separado', null],
        [4, 'anulada', null],
        [5, 'nao_instalada', null],
        [null, 'desconhecido', 'TIPO_URNA_AUSENTE'],
      ];
      for (const [indice, [tipo]] of esperado.entries()) {
        await db.updateTable('boletim_versao').set({ cd_tipo_urna: tipo }).where('id', '=', bus[indice].id).execute();
      }

      for (const [indice, [, status, motivo]] of esperado.entries()) {
        const item = await itemDaSecao(bus[indice].secao_id);
        expect(item).toMatchObject({ status, motivo });
      }

      const filtrados = await itens('&status=nao_apurada');
      expect(filtrados.items.map((item) => item.id)).toEqual([bus[0].secao_id]);
    });

    it('detalhe da seção usa o mesmo status e motivo', async () => {
      await db.updateTable('boletim_versao').set({ cd_tipo_urna: null }).where('id', '=', bus[0].id).execute();
      const resposta = await app.inject({
        method: 'GET',
        url: `/api/sections/${bus[0].secao_id}?${base}`,
      });
      expect(resposta.statusCode).toBe(200);
      expect(resposta.json().status).toMatchObject({ status: 'desconhecido', motivo: 'TIPO_URNA_AUSENTE' });
    });

    it('intradiário com DATA_HORA: antes de qualquer recebimento e depois de todos', async () => {
      expect(await totalComStatus('bu_recebido', '&as_of=2026-10-04T17:08:43-03:00')).toBe(0);
      expect(await totalComStatus('desconhecido', '&as_of=2026-10-04T17:08:43-03:00')).toBe(0);
      expect(await totalComStatus('bu_recebido', '&as_of=2026-10-04T20:40:01-03:00')).toBe(bus.length);
    });

    it('intradiário com precisão DATA é desconhecido por precisão insuficiente', async () => {
      await db
        .updateTable('boletim_versao')
        .set({ precisao_dt_bu_recebido: 'DATA', dt_bu_recebido_ts: null, dt_bu_recebido_data: '2026-10-04' })
        .where('id', '=', bus[0].id)
        .execute();

      const item = await itemDaSecao(bus[0].secao_id, '&as_of=2026-10-04T20:40:01-03:00');
      expect(item).toMatchObject({ status: 'desconhecido', motivo: 'PRECISAO_INSUFICIENTE' });
    });

    it('diário: DATA recebida no dia, DATA_HORA no dia e AUSENTE sem encerramento', async () => {
      await db
        .updateTable('boletim_versao')
        .set({ precisao_dt_bu_recebido: 'DATA', dt_bu_recebido_ts: null, dt_bu_recebido_data: '2026-10-04' })
        .where('id', '=', bus[0].id)
        .execute();
      await db
        .updateTable('boletim_versao')
        .set({
          precisao_dt_bu_recebido: 'AUSENTE',
          dt_bu_recebido_ts: null,
          dt_bu_recebido_data: null,
          dt_encerramento: null,
          dt_emissao_bu: null,
        })
        .where('id', '=', bus[1].id)
        .execute();

      const noDia = '&as_of_date=2026-10-04';
      expect(await itemDaSecao(bus[0].secao_id, noDia)).toMatchObject({ status: 'bu_recebido', motivo: null });
      expect(await itemDaSecao(bus[2].secao_id, noDia)).toMatchObject({ status: 'bu_recebido', motivo: null });
      expect(await itemDaSecao(bus[1].secao_id, noDia)).toMatchObject({
        status: 'desconhecido',
        motivo: 'PRECISAO_INSUFICIENTE',
      });

      const antesDoDia = await itemDaSecao(bus[0].secao_id, '&as_of_date=2026-10-03');
      expect(antesDoDia).toMatchObject({ status: 'sem_bu', motivo: null });
    });
  });

  describe('2018 (recebimento ausente)', () => {
    it('intradiário é desconhecido por precisão insuficiente', async () => {
      await importar('bweb_2t_AC_301020181744.csv');
      await carregarAlvo();

      expect(bus.length).toBeGreaterThan(0);
      for (const bu of bus.slice(0, 3)) {
        expect(await itemDaSecao(bu.secao_id, '&as_of=2018-10-30T12:00:00-03:00')).toMatchObject({
          status: 'desconhecido',
          motivo: 'PRECISAO_INSUFICIENTE',
        });
      }
    });
  });
});
