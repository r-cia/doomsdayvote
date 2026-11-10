import { execFile, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { criarDb } from '../../src/db/index.js';
import { agregarMetricas } from '../../src/modules/totalizacao/agregacao.js';
import { CODIGO_ERRO_BER } from '../../src/modules/totalizacao/ber.js';
import { decodificarBu } from '../../src/modules/totalizacao/bu.js';
import { carregarZip } from '../../src/modules/totalizacao/carga.js';
import { votosDoBu } from '../../src/modules/totalizacao/conferencia-rdv.js';
import { listarIntervencoes, registrarIntervencao } from '../../src/modules/totalizacao/intervencoes.js';
import { CODIGO_ERRO_ZIP } from '../../src/modules/totalizacao/zip.js';
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

const executar = promisify(execFile);
const PREFIXO = 'ac9999z1010001';
const PREFIXO_242 = 'ac9999z1010002';
const NOME_ZIP = 'bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip';
const NOME_7Z = 'bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.7z';
const SHA_BWEB = 'b'.repeat(64);
const NOME_BWEB = 'totalizacao-carga-bweb.csv';

const VOTOS_BU = votosDoCenario().length;
const VOTOS_RDV = votosDoCenario().length;

const SETE_ZIP = (() => {
  try {
    execFileSync('7z', ['i'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const db = criarDb({ connectionString: url });
let diretorio;
let caminhoZip;
let caminho7z;
let loteId;
let secaoId;
let arquivos;

async function criar7z(destino, entradas) {
  const fonte = path.join(diretorio, 'fonte7z');
  await mkdir(fonte, { recursive: true });
  for (const [nome, conteudo] of entradas) {
    await writeFile(path.join(fonte, nome), conteudo);
  }
  await executar('7z', ['a', '-t7z', destino, ...entradas.map(([nome]) => nome)], {
    cwd: fonte,
  });
}

async function carregarVariante(subpasta, extras) {
  const destino = path.join(diretorio, subpasta);
  await mkdir(destino, { recursive: true });
  const caminho = path.join(destino, NOME_ZIP);
  await writeFile(caminho, gerarZip([...arquivos, ...extras]));
  return caminho;
}

async function escreverZip(subpasta, entradas) {
  const destino = path.join(diretorio, subpasta);
  await mkdir(destino, { recursive: true });
  const caminho = path.join(destino, NOME_ZIP);
  await writeFile(caminho, gerarZip(entradas));
  return caminho;
}

function corromperCrc(conteudo, nome) {
  const buffer = Buffer.from(conteudo);
  const alvo = Buffer.from(nome, 'latin1');
  for (let offset = 0; offset + 46 < buffer.length; offset += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) continue;
    const tamanhoNome = buffer.readUInt16LE(offset + 28);
    const achado = buffer.subarray(offset + 46, offset + 46 + tamanhoNome);
    if (!achado.equals(alvo)) continue;
    buffer.writeUInt32LE((buffer.readUInt32LE(offset + 16) ^ 0xffffffff) >>> 0, offset + 16);
    return buffer;
  }
  throw new Error(`entrada não encontrada no zip: ${nome}`);
}

async function zipComRdvCorrompido(subpasta) {
  const rdv = gerarRdv({ votos: votosDoCenario() });
  const alvo = rdv.indexOf(Buffer.from([0x0a, 0x01, 0x04]));
  if (alvo < 0) throw new Error('tipo de voto não encontrado no RDV');
  rdv[alvo + 2] = 0x09;

  return escreverZip(subpasta, [
    [`${PREFIXO}-bu.dat`, gerarBu()],
    [`${PREFIXO}-rdv.dat`, rdv],
  ]);
}

async function inserirBwebSecao({ loteIdBweb, secaoPorCargo, votos, localizacao }) {
  const porCargo = new Map();
  for (const voto of votos) {
    if (!porCargo.has(voto.cd_cargo_pergunta)) porCargo.set(voto.cd_cargo_pergunta, []);
    porCargo.get(voto.cd_cargo_pergunta).push(voto);
  }

  for (const [cargo, votosCargo] of porCargo) {
    const secao = secaoPorCargo[cargo] ?? secaoPorCargo[1];
    const boletim = await db
      .insertInto('boletim_versao')
      .values({
        eleicao_id: secao.eleicao_id,
        secao_id: secao.id,
        cd_cargo_pergunta: cargo,
        ds_cargo_pergunta: `Cargo ${cargo}`,
        lote_id: loteIdBweb,
        versao: 1,
        ativo: true,
        conteudo_sha256: String(cargo).padStart(64, '0'),
        precisao_dt_bu_recebido: 'AUSENTE',
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    await db
      .insertInto('resultado_votavel')
      .values(
        votosCargo.map((voto, indice) => ({
          boletim_versao_id: boletim.id,
          cd_tipo_votavel: voto.cd_tipo_votavel,
          categoria: voto.cd_tipo_votavel === 1 ? 'nominal' : 'outro',
          nr_votavel: voto.nr_votavel ?? 0,
          qt_votos: voto.qt_votos,
          lote_id: loteIdBweb,
          nr_linha_origem: indice + 1,
          ano_eleicao: 2026,
          nr_turno: 1,
          sg_uf: CENARIO.uf,
          cd_municipio_tse: localizacao.municipio,
          nr_zona: localizacao.zona,
          nr_secao: localizacao.secao,
          cd_cargo_pergunta: cargo,
        })),
      )
      .execute();
  }
}

async function limparEleicoes() {
  await db.deleteFrom('eleicao').where('ano_eleicao', '=', 2026).where('nr_turno', '=', 1).execute();
}

async function limpar() {
  const nomes = [NOME_ZIP, NOME_7Z];
  const lotes = await db
    .selectFrom('totalizacao_lote')
    .select('id')
    .where('nome_arquivo', 'in', nomes)
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
  const idsSecoes = secoes.map((secao) => secao.id);

  if (idsLotes.length > 0) {
    await db
      .updateTable('totalizacao_lote')
      .set({ substituido_por: null })
      .where('id', 'in', idsLotes)
      .execute();
  }
  if (idsSecoes.length > 0) {
    await db.deleteFrom('totalizacao_incidente').where('totalizacao_secao_id', 'in', idsSecoes).execute();
    await db.deleteFrom('totalizacao_eleitor').where('totalizacao_secao_id', 'in', idsSecoes).execute();
    await db.deleteFrom('totalizacao_secao').where('id', 'in', idsSecoes).execute();
  }
  if (idsLotes.length > 0) {
    await db.deleteFrom('totalizacao_lote').where('id', 'in', idsLotes).execute();
  }

  await sql`
    DELETE FROM resultado_votavel
    WHERE lote_id IN (SELECT id FROM lote_importacao WHERE sha256 = ${SHA_BWEB})
  `.execute(db);
  await sql`
    DELETE FROM boletim_versao
    WHERE lote_id IN (SELECT id FROM lote_importacao WHERE sha256 = ${SHA_BWEB})
  `.execute(db);
  await sql`DELETE FROM lote_importacao WHERE sha256 = ${SHA_BWEB}`.execute(db);
  await sql`
    DELETE FROM secao_eleitoral
    WHERE cd_pleito IN (9601, 9602)
  `.execute(db);

  await sql`
    DELETE FROM localidade
    WHERE sg_uf = ${CENARIO.uf} AND cd_municipio_tse = ${CENARIO.municipio}
      AND NOT EXISTS (
        SELECT 1 FROM secao_eleitoral
        WHERE sg_uf = ${CENARIO.uf} AND cd_municipio_tse = ${CENARIO.municipio}
      )
      AND NOT EXISTS (
        SELECT 1 FROM totalizacao_secao
        WHERE sg_uf = ${CENARIO.uf} AND cd_municipio_tse = ${CENARIO.municipio}
      )
  `.execute(db);
}

async function contar(tabela, filtro) {
  const rows = await db
    .selectFrom(tabela)
    .select((eb) => eb.fn.countAll().as('total'))
    .where(filtro.coluna, '=', filtro.valor)
    .execute();
  return Number(rows[0].total);
}

async function somarPorCargo(tabela, filtro) {
  const { rows } = await sql`
    SELECT cd_cargo_pergunta, sum(qt_votos)::int AS votos
    FROM ${sql.table(tabela)}
    WHERE ${sql.ref(filtro.coluna)} = ${filtro.valor}
    GROUP BY cd_cargo_pergunta
    ORDER BY cd_cargo_pergunta
  `.execute(db);
  return rows.map((linha) => [linha.cd_cargo_pergunta, linha.votos]);
}

describe('carga dos zips de totalização por UF', () => {
  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), 'totalizacao-carga-'));
    caminhoZip = path.join(diretorio, NOME_ZIP);
    caminho7z = path.join(diretorio, NOME_7Z);

    arquivos = [
      [`${PREFIXO}-bu.dat`, gerarBu()],
      [`${PREFIXO}-rdv.dat`, gerarRdv({ votos: votosDoCenario() })],
      [`${PREFIXO}-log.jez`, gerarLogJez()],
      [`${PREFIXO}-vota.vsc`, Buffer.from('conteudo vsc ignorado')],
      ['resultado.pdf', Buffer.from('%PDF-1.4 ignorado')],
    ];

    await writeFile(caminhoZip, gerarZip(arquivos));
    if (SETE_ZIP) await criar7z(caminho7z, arquivos);
    await limpar();
  }, 60000);

  afterAll(async () => {
    await limpar();
    await limparEleicoes();
    await db.destroy();
    await rm(diretorio, { recursive: true, force: true });
  });

  it('carrega a seção, os votos e as métricas do log', async () => {
    const eventos = [];
    const resultado = await carregarZip(db, caminhoZip, {
      registrarEvento: (evento, contexto) => eventos.push({ evento, ...contexto }),
    });

    expect(resultado).toMatchObject({
      ignorado: false,
      sg_uf: CENARIO.uf,
      ano_eleicao: CENARIO.ano,
      nr_turno: CENARIO.turno,
      secoes: 1,
      votos_bu: VOTOS_BU,
      votos_rdv: VOTOS_RDV,
      arquivos_ignorados: 2,
    });

    const lote = await db
      .selectFrom('totalizacao_lote')
      .selectAll()
      .where('nome_arquivo', '=', NOME_ZIP)
      .executeTakeFirstOrThrow();
    expect(lote.status).toBe('concluido');
    expect(lote.concluido_em).toBeInstanceOf(Date);
    loteId = lote.id;

    const secao = await db
      .selectFrom('totalizacao_secao')
      .selectAll()
      .where('lote_id', '=', lote.id)
      .executeTakeFirstOrThrow();
    expect(secao).toMatchObject({
      sg_uf: CENARIO.uf,
      cd_municipio_tse: CENARIO.municipio,
      nr_zona: CENARIO.zona,
      nr_secao: CENARIO.secao,
      nr_urna_efetivada: CENARIO.urna,
      qt_comparecimento: CENARIO.comparecimento,
      qt_aptos: CENARIO.aptos,
    });
    expect(secao.dt_abertura.toISOString()).toBe('2026-10-04T07:00:01.000Z');
    expect(secao.dt_encerramento.toISOString()).toBe('2026-10-04T17:00:00.000Z');
    secaoId = secao.id;

    const filtroSecao = { coluna: 'totalizacao_secao_id', valor: secaoId };

    expect(await contar('totalizacao_bu_voto', filtroSecao)).toBe(VOTOS_BU);
    expect(await somarPorCargo('totalizacao_bu_voto', filtroSecao)).toEqual([
      [1, CENARIO.comparecimento],
      [3, CENARIO.comparecimento],
    ]);

    expect(await contar('totalizacao_rdv_voto', filtroSecao)).toBe(VOTOS_RDV);
    expect(await somarPorCargo('totalizacao_rdv_voto', filtroSecao)).toEqual([
      [1, CENARIO.comparecimento],
      [3, CENARIO.comparecimento],
    ]);

    expect(await contar('totalizacao_eleitor', filtroSecao)).toBe(CENARIO.comparecimento);
    expect(await contar('totalizacao_incidente', filtroSecao)).toBe(1);

    const divergencias = await db
      .selectFrom('totalizacao_divergencia')
      .select(['fonte', 'campo'])
      .where('lote_id', '=', lote.id)
      .execute();
    expect(divergencias).toEqual([{ fonte: 'bweb', campo: 'uf' }]);
    expect(eventos).toContainEqual(
      expect.objectContaining({
        evento: 'conferencia_ignorada',
        motivo: 'bweb_ausente',
        arquivo: NOME_ZIP,
        uf: CENARIO.uf,
        ano: CENARIO.ano,
        turno: CENARIO.turno,
        lote_id: lote.id,
      }),
    );
  }, 120000);

  it('ignora o mesmo zip pelo sha256 e não duplica linhas', async () => {
    const resultado = await carregarZip(db, caminhoZip);
    expect(resultado).toEqual({ ignorado: true, motivo: 'sha256' });

    expect(await contar('totalizacao_lote', { coluna: 'id', valor: loteId })).toBe(1);
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: loteId })).toBe(1);
    expect(await contar('totalizacao_eleitor', { coluna: 'totalizacao_secao_id', valor: secaoId })).toBe(
      CENARIO.comparecimento,
    );
    expect(await somarPorCargo('totalizacao_bu_voto', { coluna: 'totalizacao_secao_id', valor: secaoId })).toHaveLength(2);
    expect(await somarPorCargo('totalizacao_rdv_voto', { coluna: 'totalizacao_secao_id', valor: secaoId })).toHaveLength(2);
  }, 120000);

  it('não cria linha para o -vota.vsc nem para o .pdf', async () => {
    const { rows } = await sql`
      SELECT count(*)::int AS total FROM totalizacao_lote
      WHERE nome_arquivo LIKE '%vota%' OR nome_arquivo LIKE '%.pdf'
    `.execute(db);
    expect(rows[0].total).toBe(0);
  });

  it('registra a ausência do BWEB uma única vez com múltiplas eleições', async () => {
    const eleicoes = await db
      .insertInto('eleicao')
      .values([
        {
          ano_eleicao: 2026,
          cd_pleito: 9503,
          nr_turno: 1,
          cd_eleicao: 9503,
          nm_tipo_eleicao: 'Eleição Geral Federal',
        },
        {
          ano_eleicao: 2026,
          cd_pleito: 9504,
          nr_turno: 1,
          cd_eleicao: 9504,
          nm_tipo_eleicao: 'Eleições Gerais Estaduais',
        },
      ])
      .returning('id')
      .execute();

    const caminho = await carregarVariante('bweb', [['nota-bweb.txt', Buffer.from('ignorado')]]);
    const eventos = [];
    const resultado = await carregarZip(db, caminho, {
      registrarEvento: (evento, contexto) => eventos.push({ evento, ...contexto }),
    });

    expect(eventos).toContainEqual(
      expect.objectContaining({
        evento: 'conferencia_ignorada',
        motivo: 'bweb_ausente',
        arquivo: NOME_ZIP,
        uf: CENARIO.uf,
        ano: CENARIO.ano,
        turno: CENARIO.turno,
        lote_id: resultado.lote_id,
      }),
    );

    const bweb = await db
      .selectFrom('totalizacao_divergencia')
      .select(['fonte', 'campo', 'sg_uf', 'valor_esperado', 'valor_encontrado'])
      .where('lote_id', '=', resultado.lote_id)
      .execute();
    expect(bweb).toEqual([
      {
        fonte: 'bweb',
        campo: 'uf',
        sg_uf: CENARIO.uf,
        valor_esperado: 'presente',
        valor_encontrado: 'ausente',
      },
    ]);

    await db
      .updateTable('totalizacao_lote')
      .set({ status: 'falhou', concluido_em: null })
      .where('id', '=', resultado.lote_id)
      .execute();
    await carregarZip(db, caminho);

    const repetidas = await db
      .selectFrom('totalizacao_divergencia')
      .select('id')
      .where('lote_id', '=', resultado.lote_id)
      .execute();
    expect(repetidas).toHaveLength(1);

    await db.deleteFrom('eleicao').where('id', 'in', eleicoes.map((eleicao) => eleicao.id)).execute();
  }, 120000);

  it('confere o BWEB com múltiplas eleições de cargos disjuntos', async () => {
    const [federal, estadual] = await db
      .insertInto('eleicao')
      .values([
        {
          ano_eleicao: 2026,
          cd_pleito: 9601,
          nr_turno: 1,
          cd_eleicao: 9601,
          nm_tipo_eleicao: 'Eleição Geral Federal',
        },
        {
          ano_eleicao: 2026,
          cd_pleito: 9602,
          nr_turno: 1,
          cd_eleicao: 9602,
          nm_tipo_eleicao: 'Eleições Gerais Estaduais',
        },
      ])
      .returning('id')
      .execute();

    const bu242 = gerarBu({ secao: 2 });
    const buDecodificado = decodificarBu(bu242);
    const localizacao = {
      municipio: buDecodificado.localidade.municipio,
      zona: buDecodificado.localidade.zona,
      secao: buDecodificado.localidade.secao,
    };

    await db
      .insertInto('localidade')
      .values({
        sg_uf: CENARIO.uf,
        cd_municipio_tse: localizacao.municipio,
        nm_municipio: `MUNICÍPIO ${localizacao.municipio}`,
      })
      .onConflict((oc) => oc.columns(['sg_uf', 'cd_municipio_tse']).doNothing())
      .execute();

    const [secaoFederal, secaoEstadual] = await db
      .insertInto('secao_eleitoral')
      .values([
        {
          ano_eleicao: 2026,
          cd_pleito: 9601,
          nr_turno: 1,
          sg_uf: CENARIO.uf,
          cd_municipio_tse: localizacao.municipio,
          nr_zona: localizacao.zona,
          nr_secao: localizacao.secao,
        },
        {
          ano_eleicao: 2026,
          cd_pleito: 9602,
          nr_turno: 1,
          sg_uf: CENARIO.uf,
          cd_municipio_tse: localizacao.municipio,
          nr_zona: localizacao.zona,
          nr_secao: localizacao.secao,
        },
      ])
      .returning('id')
      .execute();

    const loteBweb = await db
      .insertInto('lote_importacao')
      .values({
        nome_arquivo: NOME_BWEB,
        sha256: SHA_BWEB,
        tamanho_bytes: 1000,
        captured_at: new Date('2026-10-04T21:00:00Z'),
        status: 'concluido',
        leiaute: 'BWEB_45',
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const votos = votosDoBu(buDecodificado).filter((voto) =>
      [1, 3].includes(voto.cd_cargo_pergunta),
    );
    votos.push({ cd_cargo_pergunta: 5, cd_tipo_votavel: 1, nr_votavel: 999, qt_votos: 9999 });

    await inserirBwebSecao({
      loteIdBweb: loteBweb.id,
      secaoPorCargo: {
        1: { id: secaoFederal.id, eleicao_id: federal.id },
        3: { id: secaoEstadual.id, eleicao_id: estadual.id },
        5: { id: secaoFederal.id, eleicao_id: federal.id },
      },
      votos,
      localizacao,
    });

    const caminho = await escreverZip('bweb-eleicoes', [[`${PREFIXO_242}-bu.dat`, bu242]]);
    const eventos = [];
    const resultado = await carregarZip(db, caminho, {
      registrarEvento: (evento, contexto) => eventos.push({ evento, ...contexto }),
    });

    expect(resultado).toMatchObject({
      ignorado: false,
      status: 'concluido',
      secoes: 1,
    });
    expect(eventos.some((evento) => evento.evento === 'conferencia_ignorada')).toBe(false);

    const divergencias = await db
      .selectFrom('totalizacao_divergencia')
      .select(['fonte', 'campo', 'cd_cargo_pergunta'])
      .where('lote_id', '=', resultado.lote_id)
      .execute();
    expect(divergencias).toEqual([]);
  }, 120000);

  it('registra a seção com erro e mantém o lote parcial', async () => {
    const caminho = await zipComRdvCorrompido('falha');
    const eventos = [];
    const resultado = await carregarZip(db, caminho, {
      registrarEvento: (evento, contexto) => eventos.push({ evento, ...contexto }),
    });

    expect(resultado).toMatchObject({
      ignorado: false,
      status: 'parcial',
      secoes: 1,
      secoes_com_erro: 1,
      votos_bu: 0,
      votos_rdv: 0,
    });

    const falha = eventos.find((evento) => evento.evento === 'secao_falhou');
    expect(falha).toMatchObject({
      arquivo: NOME_ZIP,
      secao: PREFIXO,
      prefixo: PREFIXO,
      erro_codigo: CODIGO_ERRO_BER.INVALIDO,
      erro_mensagem: expect.stringMatching(/^fonte=RDV; offset=\d+; tipo de voto desconhecido: 9$/),
    });
    expect(eventos.some((evento) => evento.evento === 'lote_falhou')).toBe(false);

    const lote = await db
      .selectFrom('totalizacao_lote')
      .select('status')
      .where('id', '=', resultado.lote_id)
      .executeTakeFirstOrThrow();
    expect(lote.status).toBe('parcial');

    const erro = await db
      .selectFrom('totalizacao_secao_erro')
      .selectAll()
      .where('lote_id', '=', resultado.lote_id)
      .executeTakeFirstOrThrow();
    expect(erro).toMatchObject({
      prefixo: PREFIXO,
      sg_uf: CENARIO.uf,
      codigo: CODIGO_ERRO_BER.INVALIDO,
      mensagem: expect.stringMatching(/^fonte=RDV; offset=\d+; tipo de voto desconhecido: 9$/),
      cd_municipio_tse: CENARIO.municipio,
      nr_zona: CENARIO.zona,
      nr_secao: CENARIO.secao,
    });
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: resultado.lote_id })).toBe(0);
  }, 120000);

  it('com --falhar-rapido aborta o arquivo na seção com erro', async () => {
    const caminho = await zipComRdvCorrompido('falha-rapida');
    const eventos = [];

    await expect(
      carregarZip(db, caminho, {
        falharRapido: true,
        registrarEvento: (evento, contexto) => eventos.push({ evento, ...contexto }),
      }),
    ).rejects.toThrow('tipo de voto desconhecido: 9');

    const falha = eventos.find((evento) => evento.evento === 'lote_falhou');
    expect(falha).toMatchObject({
      arquivo: NOME_ZIP,
      secao: PREFIXO,
      erro_codigo: CODIGO_ERRO_BER.INVALIDO,
      erro_mensagem: expect.stringMatching(/^fonte=RDV; offset=\d+; tipo de voto desconhecido: 9$/),
      status: 'falhou',
    });

    const lote = await db
      .selectFrom('totalizacao_lote')
      .select('status')
      .where('id', '=', falha.lote_id)
      .executeTakeFirstOrThrow();
    expect(lote.status).toBe('falhou');
  }, 120000);

  it('reimporta o lote parcial do zero, sem retomar as seções gravadas', async () => {
    const bu = gerarBu();
    const rdv = gerarRdv({ votos: votosDoCenario() });
    const log = gerarLogJez();
    const bu242 = gerarBu({ secao: 2 });

    const caminho = await escreverZip('reinicio', [
      [`${PREFIXO}-bu.dat`, bu],
      [`${PREFIXO}-rdv.dat`, rdv],
      [`${PREFIXO}-log.jez`, log],
      [`${PREFIXO_242}-bu.dat`, bu242.subarray(0, 32)],
    ]);

    const primeira = await carregarZip(db, caminho);
    expect(primeira).toMatchObject({
      status: 'parcial',
      secoes: 2,
      secoes_processadas: 2,
      secoes_com_erro: 1,
      votos_bu: VOTOS_BU,
      votos_rdv: VOTOS_RDV,
    });
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: primeira.lote_id })).toBe(1);
    expect(await contar('totalizacao_secao_erro', { coluna: 'lote_id', valor: primeira.lote_id })).toBe(1);

    const processadas = [];
    const segunda = await carregarZip(db, caminho, {
      aoProgredir: ({ etapa, prefixo }) => {
        if (etapa === 'secao') processadas.push(prefixo);
      },
    });

    expect(processadas).toEqual([PREFIXO, PREFIXO_242]);
    expect(segunda).toMatchObject({
      status: 'parcial',
      secoes: 2,
      secoes_processadas: 2,
      secoes_ignoradas: 0,
      votos_bu: VOTOS_BU,
      votos_rdv: VOTOS_RDV,
    });
    expect(segunda.lote_id).not.toBe(primeira.lote_id);
    expect(await contar('totalizacao_lote', { coluna: 'id', valor: primeira.lote_id })).toBe(0);
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: primeira.lote_id })).toBe(0);
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: segunda.lote_id })).toBe(1);
    expect(await contar('totalizacao_secao_erro', { coluna: 'lote_id', valor: segunda.lote_id })).toBe(1);
  }, 120000);

  it('detecta CRC divergente e registra a seção como erro', async () => {
    const zip = gerarZip([
      [`${PREFIXO}-bu.dat`, gerarBu()],
      [`${PREFIXO}-rdv.dat`, gerarRdv({ votos: votosDoCenario() })],
    ]);

    const destino = path.join(diretorio, 'crc');
    await mkdir(destino, { recursive: true });
    const caminho = path.join(destino, NOME_ZIP);
    await writeFile(caminho, corromperCrc(zip, `${PREFIXO}-bu.dat`));

    const resultado = await carregarZip(db, caminho);
    expect(resultado).toMatchObject({ status: 'parcial', secoes_com_erro: 1 });
    expect(await contar('totalizacao_secao', { coluna: 'lote_id', valor: resultado.lote_id })).toBe(0);

    const erro = await db
      .selectFrom('totalizacao_secao_erro')
      .selectAll()
      .where('lote_id', '=', resultado.lote_id)
      .executeTakeFirstOrThrow();
    expect(erro).toMatchObject({ prefixo: PREFIXO, codigo: CODIGO_ERRO_ZIP.CRC });
  }, 120000);

  it('registra erro sem_bu quando a seção não traz o -bu.dat', async () => {
    const caminho = await escreverZip('sem-bu', [
      [`${PREFIXO}-rdv.dat`, gerarRdv({ votos: votosDoCenario() })],
    ]);

    const resultado = await carregarZip(db, caminho);
    expect(resultado).toMatchObject({
      status: 'parcial',
      secoes: 1,
      secoes_com_erro: 1,
      secoes_sem_rdv: 0,
      secoes_sem_log: 1,
    });

    const erro = await db
      .selectFrom('totalizacao_secao_erro')
      .selectAll()
      .where('lote_id', '=', resultado.lote_id)
      .executeTakeFirstOrThrow();
    expect(erro).toMatchObject({ prefixo: PREFIXO, codigo: 'SEM_BU' });
    expect(erro.mensagem).toBe(`seção ${PREFIXO} sem -bu.dat`);
  }, 120000);

  it('substitui o lote anterior da mesma UF, ano e turno sem somar os dois', async () => {
    const caminhoA = await escreverZip('substituicao-a', [[`${PREFIXO}-bu.dat`, gerarBu()]]);
    const anterior = await carregarZip(db, caminhoA);
    expect(anterior.status).toBe('concluido');

    const caminhoB = await escreverZip('substituicao-b', [
      [`${PREFIXO_242}-bu.dat`, gerarBu({ secao: 2 })],
    ]);
    const novo = await carregarZip(db, caminhoB);
    expect(novo.status).toBe('concluido');

    const loteAnterior = await db
      .selectFrom('totalizacao_lote')
      .selectAll()
      .where('id', '=', anterior.lote_id)
      .executeTakeFirstOrThrow();
    expect(loteAnterior).toMatchObject({
      status: 'substituido',
      substituido_por: novo.lote_id,
    });

    const agregado = await agregarMetricas(db, {
      anoEleicao: CENARIO.ano,
      nrTurno: CENARIO.turno,
      sgUf: CENARIO.uf,
    });
    expect(agregado.complementares).toMatchObject({ secoes: 1, aptos: CENARIO.aptos });
  }, 120000);

  it('registra a intervenção por ponteiro e contagem e reverte junto com a transação', async () => {
    const caminhoBase = await escreverZip('intervencao', [[`${PREFIXO}-bu.dat`, gerarBu()]]);
    const resultado = await carregarZip(db, caminhoBase);
    const intervencao = {
      loteId: resultado.lote_id,
      prefixo: PREFIXO,
      fonte: 'LOG',
      posicao: 'linhas 1-3',
      tipo: 'JANELA_DO_TURNO',
      descricao: 'eventos de outro turno fora da janela do BU',
      impacto: '10 eventos e 2 votos computados de outro turno',
    };

    await db.transaction().execute((trx) => registrarIntervencao(trx, intervencao));
    expect(await listarIntervencoes(db, resultado.lote_id)).toMatchObject([
      {
        prefixo: PREFIXO,
        fonte: 'LOG',
        posicao: 'linhas 1-3',
        tipo: 'JANELA_DO_TURNO',
        impacto: '10 eventos e 2 votos computados de outro turno',
      },
    ]);

    await expect(
      db.transaction().execute(async (trx) => {
        await registrarIntervencao(trx, { ...intervencao, tipo: 'SEGUNDA' });
        throw new Error('falha depois do registro');
      }),
    ).rejects.toThrow('falha depois do registro');
    expect(await listarIntervencoes(db, resultado.lote_id)).toHaveLength(1);

    await expect(
      registrarIntervencao(db, { ...intervencao, fonte: 'ARQUIVO' }),
    ).rejects.toThrow();
  }, 120000);
});
