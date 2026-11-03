import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { lerArquivoBweb } from '../../src/modules/importacao/bweb/ler-arquivo.js';
import { decodificarBu } from '../../src/modules/totalizacao/bu.js';
import { votosDoBu } from '../../src/modules/totalizacao/conferencia-rdv.js';
import { conferirBuBweb } from '../../src/modules/totalizacao/conferencia-bweb.js';
import { CENARIO, gerarBweb, gerarBu } from '../helpers/dados-sinteticos.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });

const bu = decodificarBu(gerarBu());

const UF = CENARIO.uf;
const MUNICIPIO = CENARIO.municipio;
const ZONA = CENARIO.zona;
const SECAO = CENARIO.secao;
const ANO = CENARIO.ano;
const PLEITO_FEDERAL = 8421;
const PLEITO_ESTADUAL = 8422;
const NOME_ARQUIVO = 'conferencia-bweb-sintetico.zip';
const SHA256 = 'f'.repeat(64);

const LOCALIZACAO = {
  sg_uf: UF,
  cd_municipio_tse: MUNICIPIO,
  nr_zona: ZONA,
  nr_secao: SECAO,
};

let eleicaoFederalId;
let eleicaoEstadualId;
let loteId;
let secaoId;
let secaoTotalizacaoId;
let loteImportacaoId;
let diretorio;
let votosBweb;

async function inserirBweb({ secao, nrSecao, votos, secaoPorCargo = {} }) {
  const porCargo = new Map();
  for (const voto of votos) {
    if (!porCargo.has(voto.cd_cargo_pergunta)) porCargo.set(voto.cd_cargo_pergunta, []);
    porCargo.get(voto.cd_cargo_pergunta).push(voto);
  }

  const ids = [];
  for (const [cargo, votosCargo] of porCargo) {
    const boletim = await db
      .insertInto('boletim_versao')
      .values({
        eleicao_id: cargo === 3 ? eleicaoEstadualId : eleicaoFederalId,
        secao_id: secaoPorCargo[cargo] ?? secao,
        cd_cargo_pergunta: cargo,
        ds_cargo_pergunta: `Cargo ${cargo}`,
        lote_id: loteImportacaoId,
        versao: 1,
        ativo: true,
        conteudo_sha256: String(cargo).padStart(64, '0'),
        precisao_dt_bu_recebido: 'AUSENTE',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    ids.push(boletim.id);

    await db
      .insertInto('resultado_votavel')
      .values(
        votosCargo.map((voto, indice) => ({
          boletim_versao_id: boletim.id,
          cd_tipo_votavel: voto.cd_tipo_votavel,
          categoria: voto.cd_tipo_votavel === 1 ? 'nominal' : 'outro',
          nr_votavel: voto.nr_votavel ?? 0,
          qt_votos: voto.qt_votos,
          lote_id: loteImportacaoId,
          nr_linha_origem: indice + 1,
          ano_eleicao: ANO,
          nr_turno: CENARIO.turno,
          sg_uf: UF,
          cd_municipio_tse: MUNICIPIO,
          nr_zona: ZONA,
          nr_secao: nrSecao,
          cd_cargo_pergunta: cargo,
        })),
      )
      .execute();
  }

  return ids;
}

function conferir() {
  return conferirBuBweb(db, {
    loteId,
    anoEleicao: ANO,
    nrTurno: CENARIO.turno,
    votosBu: votosDoBu(bu),
    sgUf: UF,
    cdMunicipioTse: MUNICIPIO,
    nrZona: ZONA,
    nrSecao: SECAO,
  });
}

async function contarDivergencias() {
  const { rows } = await sql`
    SELECT count(*)::int AS total FROM totalizacao_divergencia WHERE lote_id = ${loteId}
  `.execute(db);
  return rows[0].total;
}

async function limpar() {
  await sql`
    DELETE FROM totalizacao_divergencia
    WHERE lote_id IN (SELECT id FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO})
  `.execute(db);
  await sql`
    DELETE FROM totalizacao_secao
    WHERE lote_id IN (SELECT id FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO})
  `.execute(db);
  await sql`DELETE FROM totalizacao_lote WHERE nome_arquivo = ${NOME_ARQUIVO}`.execute(db);
  await sql`
    DELETE FROM resultado_votavel
    WHERE lote_id IN (SELECT id FROM lote_importacao WHERE sha256 = ${SHA256})
  `.execute(db);
  await sql`
    DELETE FROM boletim_versao
    WHERE lote_id IN (SELECT id FROM lote_importacao WHERE sha256 = ${SHA256})
  `.execute(db);
  await sql`DELETE FROM lote_importacao WHERE sha256 = ${SHA256}`.execute(db);
  await sql`
    DELETE FROM secao_eleitoral
    WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
  `.execute(db);
  await sql`
    DELETE FROM localidade
    WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
      AND NOT EXISTS (
        SELECT 1 FROM secao_eleitoral
        WHERE sg_uf = ${UF} AND cd_municipio_tse = ${MUNICIPIO}
      )
  `.execute(db);
  await sql`
    DELETE FROM eleicao
    WHERE ano_eleicao = ${ANO}
      AND cd_pleito IN (${PLEITO_FEDERAL}, ${PLEITO_ESTADUAL})
      AND nr_turno = ${CENARIO.turno}
  `.execute(db);
}

describe('conferência BU × BWEB', () => {
  beforeAll(async () => {
    await limpar();

    const eleicoes = await db
      .insertInto('eleicao')
      .values([
        {
          ano_eleicao: ANO,
          cd_pleito: PLEITO_FEDERAL,
          nr_turno: CENARIO.turno,
          cd_eleicao: PLEITO_FEDERAL,
          nm_tipo_eleicao: 'Eleição Geral Federal',
        },
        {
          ano_eleicao: ANO,
          cd_pleito: PLEITO_ESTADUAL,
          nr_turno: CENARIO.turno,
          cd_eleicao: PLEITO_ESTADUAL,
          nm_tipo_eleicao: 'Eleições Gerais Estaduais',
        },
      ])
      .returning('id')
      .execute();
    eleicaoFederalId = eleicoes[0].id;
    eleicaoEstadualId = eleicoes[1].id;

    await db
      .insertInto('localidade')
      .values({ sg_uf: UF, cd_municipio_tse: MUNICIPIO, nm_municipio: `MUNICÍPIO ${MUNICIPIO}` })
      .execute();

    const secao = await db
      .insertInto('secao_eleitoral')
      .values({
        ano_eleicao: ANO,
        cd_pleito: PLEITO_FEDERAL,
        nr_turno: CENARIO.turno,
        sg_uf: UF,
        cd_municipio_tse: MUNICIPIO,
        nr_zona: ZONA,
        nr_secao: SECAO,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    secaoId = secao.id;

    const sentinela = await db
      .insertInto('secao_eleitoral')
      .values({
        ano_eleicao: ANO,
        cd_pleito: PLEITO_FEDERAL,
        nr_turno: CENARIO.turno,
        sg_uf: UF,
        cd_municipio_tse: MUNICIPIO,
        nr_zona: ZONA,
        nr_secao: SECAO + 1,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const loteImportacao = await db
      .insertInto('lote_importacao')
      .values({
        nome_arquivo: 'conferencia-bweb-sintetico.csv',
        sha256: SHA256,
        tamanho_bytes: 1000,
        captured_at: new Date('2026-10-04T21:00:00Z'),
        status: 'concluido',
        leiaute: 'BWEB_45',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    loteImportacaoId = loteImportacao.id;

    const lote = await db
      .insertInto('totalizacao_lote')
      .values({
        nome_arquivo: NOME_ARQUIVO,
        sg_uf: UF,
        ano_eleicao: ANO,
        nr_turno: CENARIO.turno,
        sha256: SHA256,
        status: 'concluido',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    loteId = lote.id;

    const secaoTotalizacao = await db
      .insertInto('totalizacao_secao')
      .values({
        lote_id: loteId,
        prefixo: 'ac9999z1010001',
        ano_eleicao: ANO,
        nr_turno: CENARIO.turno,
        sg_uf: UF,
        cd_municipio_tse: MUNICIPIO,
        nr_zona: ZONA,
        nr_secao: SECAO,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    secaoTotalizacaoId = secaoTotalizacao.id;

    const votos = votosDoBu(bu).filter((voto) => [1, 3].includes(voto.cd_cargo_pergunta));
    await db
      .insertInto('totalizacao_bu_voto')
      .values(votos.map((voto) => ({ totalizacao_secao_id: secaoTotalizacaoId, ...voto })))
      .execute();

    diretorio = await mkdtemp(path.join(tmpdir(), 'conferencia-bweb-'));
    const caminhoBweb = path.join(diretorio, 'bweb-sintetico.csv');
    await writeFile(caminhoBweb, gerarBweb({}), 'latin1');

    const lido = await lerArquivoBweb(caminhoBweb, { nomeArquivo: path.basename(caminhoBweb) });
    expect(lido.leiaute).toBe('BWEB_45');
    votosBweb = [];
    for await (const registro of lido.registros) {
      votosBweb.push({
        cd_cargo_pergunta: registro.valores.CD_CARGO_PERGUNTA,
        cd_tipo_votavel: registro.valores.CD_TIPO_VOTAVEL,
        nr_votavel: registro.valores.NR_VOTAVEL,
        qt_votos: registro.valores.QT_VOTOS,
      });
    }

    await inserirBweb({
      secao: sentinela.id,
      nrSecao: SECAO + 1,
      votos: [{ cd_cargo_pergunta: 1, cd_tipo_votavel: 1, nr_votavel: 13, qt_votos: 1 }],
    });
    await inserirBweb({ secao: secaoId, nrSecao: SECAO, votos: votosBweb });
  }, 60000);

  beforeEach(async () => {
    await db.deleteFrom('totalizacao_divergencia').where('lote_id', '=', loteId).execute();
  });

  afterAll(async () => {
    await limpar();
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it('importa o texto gerado pelo leiaute de 2026', () => {
    expect(votosBweb).toHaveLength(6);
    expect(votosBweb.filter((voto) => voto.cd_cargo_pergunta === 1)).toHaveLength(3);
    expect(votosBweb.filter((voto) => voto.cd_cargo_pergunta === 3)).toHaveLength(3);
    expect(
      votosBweb.reduce((total, voto) => total + voto.qt_votos, 0),
    ).toBe(2 * CENARIO.comparecimento);
  });

  it('não diverge e não grava linhas quando o BWEB reproduz o BU', async () => {
    await expect(conferir()).resolves.toEqual([]);
    expect(await contarDivergencias()).toBe(0);
  });

  it('ignora cargos fora de 1 e 3 no BWEB', async () => {
    await inserirBweb({
      secao: secaoId,
      nrSecao: SECAO,
      votos: [{ cd_cargo_pergunta: 5, cd_tipo_votavel: 1, nr_votavel: 999, qt_votos: 9999 }],
    });

    await expect(conferir()).resolves.toEqual([]);
    expect(await contarDivergencias()).toBe(0);

    await sql`
      DELETE FROM resultado_votavel
      WHERE boletim_versao_id IN (
        SELECT id FROM boletim_versao
        WHERE secao_id = ${secaoId} AND cd_cargo_pergunta = 5
      )
    `.execute(db);
    await db
      .deleteFrom('boletim_versao')
      .where('secao_id', '=', secaoId)
      .where('cd_cargo_pergunta', '=', 5)
      .execute();
  });

  it('registra a ausência da UF quando não há nenhuma linha de BWEB', async () => {
    const divergencias = await conferirBuBweb(db, {
      loteId,
      anoEleicao: ANO,
      nrTurno: CENARIO.turno,
      votosBu: votosDoBu(bu),
      sgUf: 'AP',
      cdMunicipioTse: 9998,
      nrZona: 1,
      nrSecao: 1,
    });

    expect(divergencias).toEqual([
      {
        fonte: 'bweb',
        campo: 'uf',
        sg_uf: 'AP',
        cd_municipio_tse: 9998,
        nr_zona: 1,
        nr_secao: 1,
        cd_cargo_pergunta: null,
        nr_votavel: null,
        valor_esperado: 'presente',
        valor_encontrado: 'ausente',
      },
    ]);
    expect(await contarDivergencias()).toBe(1);
  });

  it('sinaliza exatamente um votável adulterado no BWEB', async () => {
    await sql`
      UPDATE resultado_votavel
      SET qt_votos = qt_votos + 1
      WHERE boletim_versao_id IN (
        SELECT id FROM boletim_versao
        WHERE secao_id = ${secaoId} AND cd_cargo_pergunta = 1
      )
        AND cd_tipo_votavel = 1
        AND nr_votavel = 13
    `.execute(db);

    const divergencias = await conferir();

    expect(divergencias).toEqual([
      {
        fonte: 'bweb',
        campo: 'votos',
        ...LOCALIZACAO,
        cd_cargo_pergunta: 1,
        nr_votavel: 13,
        valor_esperado: '1',
        valor_encontrado: '2',
      },
    ]);
    expect(await contarDivergencias()).toBe(1);

    await sql`
      UPDATE resultado_votavel
      SET qt_votos = qt_votos - 1
      WHERE boletim_versao_id IN (
        SELECT id FROM boletim_versao
        WHERE secao_id = ${secaoId} AND cd_cargo_pergunta = 1
      )
        AND cd_tipo_votavel = 1
        AND nr_votavel = 13
    `.execute(db);
  });

  it('registra a ausência da seção sem BWEB', async () => {
    await sql`
      DELETE FROM resultado_votavel
      WHERE boletim_versao_id IN (SELECT id FROM boletim_versao WHERE secao_id = ${secaoId})
    `.execute(db);
    await db.deleteFrom('boletim_versao').where('secao_id', '=', secaoId).execute();

    const divergencias = await conferir();

    expect(divergencias).toEqual([
      {
        fonte: 'bweb',
        campo: 'secao',
        ...LOCALIZACAO,
        cd_cargo_pergunta: null,
        nr_votavel: null,
        valor_esperado: 'presente',
        valor_encontrado: 'ausente',
      },
    ]);
    expect(await contarDivergencias()).toBe(1);
  });

  it('não duplica a conferência repetida com o banco adulterado', async () => {
    const adulterados = votosDoBu(bu)
      .filter((voto) => [1, 3].includes(voto.cd_cargo_pergunta))
      .map((voto) =>
        voto.cd_cargo_pergunta === 1 && voto.nr_votavel === 13
          ? { ...voto, qt_votos: voto.qt_votos + 1 }
          : voto,
      );
    await inserirBweb({ secao: secaoId, nrSecao: SECAO, votos: adulterados });

    const primeira = await conferir();
    const segunda = await conferir();

    expect(primeira).toHaveLength(1);
    expect(segunda).toEqual(primeira);
    expect(await contarDivergencias()).toBe(1);
  });
});
