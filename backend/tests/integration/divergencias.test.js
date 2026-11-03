import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import {
  divergenciaDeAusencia,
  listarDivergencias,
  registrarDivergencias,
} from '../../src/modules/totalizacao/divergencias.js';
import { CENARIO } from '../helpers/dados-sinteticos.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });

const UF = CENARIO.uf;
const MUNICIPIO = CENARIO.municipio;
const NOME_ARQUIVO = 'divergencias-sintetico.zip';
const SHA256 = 'e'.repeat(64);

const divergencias = [
  {
    fonte: 'rdv',
    campo: 'votos',
    sg_uf: UF,
    cd_municipio_tse: MUNICIPIO,
    nr_zona: CENARIO.zona,
    nr_secao: CENARIO.secao,
    cd_cargo_pergunta: 1,
    nr_votavel: 13,
    valor_esperado: '3',
    valor_encontrado: '2',
  },
  {
    fonte: 'bweb',
    campo: 'comparecimento',
    sg_uf: UF,
    cd_municipio_tse: MUNICIPIO,
    nr_zona: CENARIO.zona,
    nr_secao: CENARIO.secao,
    valor_esperado: '3',
    valor_encontrado: '1',
  },
  divergenciaDeAusencia({
    fonte: 'log',
    campo: 'biometria',
    sgUf: UF,
    cdMunicipioTse: MUNICIPIO,
    nrZona: CENARIO.zona,
  }),
];

let loteId;

async function limpar() {
  await sql`
    DELETE FROM totalizacao_divergencia
    WHERE lote_id IN (SELECT id FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO})
  `.execute(db);
  await sql`DELETE FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO}`.execute(db);
}

describe('registro das divergências da dupla conferência', () => {
  beforeAll(async () => {
    await limpar();

    const lote = await db
      .insertInto('totalizacao_lote')
      .values({
        nome_arquivo: NOME_ARQUIVO,
        sg_uf: UF,
        ano_eleicao: 2026,
        nr_turno: 1,
        sha256: SHA256,
        status: 'concluido',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    loteId = lote.id;
  }, 60000);

  afterAll(async () => {
    await limpar();
    await db.destroy();
  });

  it('registra divergências com e sem seção e lista por fonte', async () => {
    const inseridas = await registrarDivergencias(db, loteId, divergencias);
    expect(inseridas).toBe(3);

    const linhas = await listarDivergencias(db, loteId);
    expect(linhas.map((linha) => `${linha.fonte}:${linha.campo}`)).toEqual([
      'bweb:comparecimento',
      'rdv:votos',
      'log:biometria',
    ]);
    expect(linhas[2].nr_secao).toBeNull();
    expect(linhas[2].nr_votavel).toBeNull();

    const apenasRdv = await listarDivergencias(db, loteId, { fonte: 'rdv' });
    expect(apenasRdv).toHaveLength(1);
    expect(apenasRdv[0].campo).toBe('votos');
    expect(apenasRdv[0].valor_esperado).toBe('3');
    expect(apenasRdv[0].valor_encontrado).toBe('2');

    const apenasBweb = await listarDivergencias(db, loteId, { fonte: 'bweb' });
    expect(apenasBweb.map((linha) => linha.cd_cargo_pergunta)).toEqual([null]);
  });

  it('não duplica a recarga da mesma lista', async () => {
    const inseridas = await registrarDivergencias(db, loteId, divergencias);
    expect(inseridas).toBe(0);

    const linhas = await listarDivergencias(db, loteId);
    expect(linhas).toHaveLength(3);
  });

  it('nunca deixa valor esperado ou encontrado nulo', async () => {
    const linhas = await listarDivergencias(db, loteId);
    expect(linhas).toHaveLength(3);

    for (const linha of linhas) {
      expect(linha.valor_esperado).not.toBeNull();
      expect(linha.valor_encontrado).not.toBeNull();
    }

    const ausencia = linhas.find((linha) => linha.fonte === 'log');
    expect(ausencia.valor_esperado).toBe('presente');
    expect(ausencia.valor_encontrado).toBe('ausente');
  });

  it('apaga as divergências junto com o lote', async () => {
    await db.deleteFrom('totalizacao_lote').where('id', '=', loteId).execute();

    const linhas = await listarDivergencias(db, loteId);
    expect(linhas).toHaveLength(0);
  });
});
