import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarDb } from '../../src/db/index.js';
import { agregarMetricas } from '../../src/modules/totalizacao/agregacao.js';
import { carregarZip } from '../../src/modules/totalizacao/carga.js';
import { recalcularMetricasDoLote } from '../../src/modules/totalizacao/metricas-zona.js';
import {
  CENARIO,
  gerarBu,
  gerarLogJez,
  gerarRdv,
  gerarZip,
  votosDoCenario,
} from '../helpers/dados-sinteticos.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });

const ANO = CENARIO.ano;
const TURNO = CENARIO.turno;
const UF = CENARIO.uf;
const PREFIXO = 'ac9999z1010001';
const NOME_ZIP = 'bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip';

let diretorio;
let loteId;

function recorte(extra) {
  return { anoEleicao: ANO, nrTurno: TURNO, ...extra };
}

function recorteDaSecao() {
  return recorte({
    sgUf: UF,
    cdMunicipioTse: CENARIO.municipio,
    nrZona: CENARIO.zona,
    nrSecao: CENARIO.secao,
  });
}

async function limpar() {
  const lotes = await db
    .selectFrom('totalizacao_lote')
    .select('id')
    .where('sg_uf', '=', UF)
    .where('ano_eleicao', '=', ANO)
    .execute();
  const idsLotes = lotes.map((lote) => lote.id);
  const secoes =
    idsLotes.length === 0
      ? []
      : await db
          .selectFrom('totalizacao_secao')
          .select('id')
          .where('lote_id', 'in', idsLotes)
          .execute();
  const ids = secoes.map((secao) => secao.id);

  if (ids.length > 0) {
    await db.deleteFrom('totalizacao_incidente').where('totalizacao_secao_id', 'in', ids).execute();
    await db.deleteFrom('totalizacao_eleitor').where('totalizacao_secao_id', 'in', ids).execute();
    await db.deleteFrom('totalizacao_secao').where('id', 'in', ids).execute();
  }
  if (idsLotes.length > 0) {
    await db
      .updateTable('totalizacao_lote')
      .set({ substituido_por: null })
      .where('id', 'in', idsLotes)
      .execute();
    await db.deleteFrom('totalizacao_lote').where('id', 'in', idsLotes).execute();
  }

  await db
    .deleteFrom('localidade')
    .where('sg_uf', '=', UF)
    .where('cd_municipio_tse', '=', CENARIO.municipio)
    .execute();
}

describe('agregação das métricas de totalização', () => {
  beforeAll(async () => {
    await limpar();

    diretorio = await mkdtemp(path.join(tmpdir(), 'agregacao-totalizacao-'));
    const caminho = path.join(diretorio, NOME_ZIP);
    await writeFile(
      caminho,
      gerarZip([
        [`${PREFIXO}-bu.dat`, gerarBu()],
        [`${PREFIXO}-rdv.dat`, gerarRdv({ votos: votosDoCenario() })],
        [`${PREFIXO}-log.jez`, gerarLogJez()],
      ]),
    );

    const resultado = await carregarZip(db, caminho);
    loteId = resultado.lote_id;
  }, 60000);

  afterAll(async () => {
    await limpar();
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it('infere o escopo pela granularidade do recorte', async () => {
    expect((await agregarMetricas(db, recorte())).escopo).toBe('nacional');
    expect((await agregarMetricas(db, recorte({ sgUf: UF }))).escopo).toBe('uf');
    expect(
      (await agregarMetricas(db, recorte({ sgUf: UF, cdMunicipioTse: CENARIO.municipio }))).escopo,
    ).toBe('municipio');
    expect(
      (await agregarMetricas(db, recorte({ sgUf: UF, cdMunicipioTse: CENARIO.municipio, nrZona: CENARIO.zona })))
        .escopo,
    ).toBe('zona');
    expect((await agregarMetricas(db, recorteDaSecao())).escopo).toBe('secao');
  });

  it('fecha as três famílias de números da seção até o nacional', async () => {
    const secao = await agregarMetricas(db, recorteDaSecao());
    const uf = await agregarMetricas(db, recorte({ sgUf: UF }));
    const nacional = await agregarMetricas(db, recorte());

    const { escopo: escopoNacional, ...metricasNacional } = nacional;
    const { escopo: escopoUf, ...metricasUf } = uf;
    const { escopo: escopoSecao, ...metricasSecao } = secao;

    expect(escopoSecao).toBe('secao');
    expect(escopoUf).toBe('uf');
    expect(escopoNacional).toBe('nacional');
    expect(metricasUf).toEqual(metricasSecao);
    expect(metricasNacional).toEqual(metricasSecao);
  });

  it('conta a biometria por faixa de falhas e o resto em outra', async () => {
    const nacional = await agregarMetricas(db, recorte());

    expect(nacional.biometria).toEqual({
      falhou1: 1,
      falhou2: 1,
      falhou3: 0,
      falhou4: 0,
      manual: 0,
    });
    expect(nacional.tempo).toEqual({
      quantidade: CENARIO.comparecimento,
      mediaMs: 20000,
      medianaMs: 20000,
      maisRapidoMs: 10000,
      maisDemoradoMs: 30000,
    });
  });

  it('soma incidentes e complementares do recorte', async () => {
    const nacional = await agregarMetricas(db, recorte());

    expect(nacional.incidentes.total).toBe(1);
    expect(nacional.complementares).toEqual({
      secoes: 1,
      aptos: CENARIO.aptos,
      comparecimento: CENARIO.comparecimento,
      teclasIndevidas: 1,
      correcoes: 1,
    });

    const secao = await agregarMetricas(db, recorteDaSecao());
    expect(secao.complementares).toEqual({
      secoes: 1,
      aptos: CENARIO.aptos,
      comparecimento: CENARIO.comparecimento,
      teclasIndevidas: 1,
      correcoes: 1,
    });
    expect(secao.incidentes.total).toBe(1);
  });

  it('recorta pelo lote sem perder a soma da UF', async () => {
    const peloLote = await agregarMetricas(db, recorte({ loteId }));
    const pelaUf = await agregarMetricas(db, recorte({ sgUf: UF }));

    const { escopo: escopoLote, ...metricasLote } = peloLote;
    const { escopo: escopoUf, ...metricasUf } = pelaUf;

    expect(escopoLote).toBe('nacional');
    expect(escopoUf).toBe('uf');
    expect(metricasLote).toEqual(metricasUf);
  });

  it('lê as métricas da zona gravadas na carga e cai para os eleitores quando o lote não as tem', async () => {
    const pelaSecao = await agregarMetricas(db, recorteDaSecao());
    const pelaZona = await agregarMetricas(db, recorte({ sgUf: UF, nrZona: CENARIO.zona }));
    const nacional = await agregarMetricas(db, recorte());

    expect(
      await db
        .selectFrom('totalizacao_zona_metrica')
        .select('qt_incidentes')
        .where('lote_id', '=', loteId)
        .execute(),
    ).toEqual([{ qt_incidentes: 1 }]);
    expect(pelaZona).toEqual(pelaSecao);
    expect(nacional).toEqual(pelaSecao);

    await db.deleteFrom('totalizacao_zona_duracao').where('lote_id', '=', loteId).execute();
    await db.deleteFrom('totalizacao_zona_metrica').where('lote_id', '=', loteId).execute();
    expect(await agregarMetricas(db, recorte())).toEqual(pelaSecao);
    await recalcularMetricasDoLote(db, loteId);
    expect(await agregarMetricas(db, recorte())).toEqual(pelaSecao);
  });

  it('usa só o lote vigente por UF quando o recorte não traz lote', async () => {
    const antigo = await db
      .insertInto('totalizacao_lote')
      .values({
        nome_arquivo: 'agregacao-AC-antigo.zip',
        sg_uf: UF,
        ano_eleicao: ANO,
        nr_turno: TURNO,
        sha256: 'e'.repeat(64),
        status: 'concluido',
        iniciado_em: new Date(Date.now() - 3600000),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    await db
      .insertInto('totalizacao_secao')
      .values({
        lote_id: antigo.id,
        ano_eleicao: ANO,
        nr_turno: TURNO,
        sg_uf: UF,
        cd_municipio_tse: CENARIO.municipio,
        nr_zona: CENARIO.zona,
        nr_secao: CENARIO.secao + 9,
        qt_aptos: 999,
        qt_comparecimento: 1,
      })
      .execute();

    const pelaUf = await agregarMetricas(db, recorte({ sgUf: UF }));
    expect(pelaUf.complementares).toMatchObject({
      secoes: 1,
      aptos: CENARIO.aptos,
      comparecimento: CENARIO.comparecimento,
    });

    const nacional = await agregarMetricas(db, recorte());
    expect(nacional.complementares).toMatchObject({ secoes: 1, aptos: CENARIO.aptos });
  });
});
