import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrarEventoCarga } from '../../lib/log-carga.js';
import { decodificarBu } from './bu.js';
import { conferirBuBweb, existeBwebDaUf } from './conferencia-bweb.js';
import { conferirBuLog, janelaDoBu } from './conferencia-log.js';
import { registrarIntervencao } from './intervencoes.js';
import { conferirBuRdv, votosDoBu } from './conferencia-rdv.js';
import { registrarDivergencias } from './divergencias.js';
import { decodificarRdv } from './rdv.js';
import { parsearLogJez } from './log.js';
import { contarSemPar, registrarEleitores, registrarIncidentes } from './metricas.js';
import {
  abrirZipArquivo,
  detectarFormatoArquivo,
  lerEntradas7z,
  listarEntradas7z,
} from './zip.js';

const CAMINHO_MUNICIPIOS = fileURLToPath(
  new URL('../../../data/geo/municipios-tse-ibge.csv', import.meta.url),
);
const NOME_ORIGEM = /^bu_imgbu_logjez_rdv_vscmr_(\d{4})_([12])t_([a-z]{2})\.(?:zip|7z)$/i;
const SUFIXOS = Object.freeze([
  ['-bu.dat', 'bu'],
  ['-rdv.dat', 'rdv'],
  ['-log.jez', 'log'],
  ['.bu', 'bu'],
  ['.rdv', 'rdv'],
  ['.logjez', 'log'],
]);
const CODIGO_SEM_BU = 'SEM_BU';
const CODIGO_INTERNO = 'ERRO_INTERNO';

let municipios;

async function carregarMunicipios() {
  if (municipios) return municipios;
  municipios = new Map();
  const linhas = (await readFile(CAMINHO_MUNICIPIOS, 'utf8')).trim().split('\n').slice(1);
  for (const linha of linhas) {
    const [cdTse, , nome, sgUf] = linha.split(';');
    if (cdTse && nome && sgUf) municipios.set(`${sgUf}:${Number(cdTse)}`, nome);
  }
  return municipios;
}

function instanteBu(valor) {
  const achado = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(valor);
  if (!achado) throw new Error(`data/hora do BU fora do formato: ${valor}`);
  const [, ano, mes, dia, hora, minuto, segundo] = achado;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function derivarOrigem(nomeArquivo) {
  const achado = NOME_ORIGEM.exec(nomeArquivo);
  if (!achado) {
    throw new Error(
      `nome de arquivo fora do padrão bu_imgbu_logjez_rdv_vscmr_<ano>_<turno>_<UF>.zip ou .7z: ${nomeArquivo}`,
    );
  }
  return {
    ano_eleicao: Number(achado[1]),
    nr_turno: Number(achado[2]),
    sg_uf: achado[3].toUpperCase(),
  };
}

function lerFonte(fonte, executar, localizacao = null) {
  try {
    return executar();
  } catch (erro) {
    const partes = [`fonte=${fonte}`];
    if (erro.offset !== undefined) partes.push(`offset=${erro.offset}`);
    partes.push(erro.message);
    erro.message = partes.join('; ');
    if (localizacao) erro.localizacao = localizacao;
    throw erro;
  }
}

async function hashArquivo(caminho) {
  const hash = createHash('sha256');
  for await (const pedaco of createReadStream(caminho)) hash.update(pedaco);
  return hash.digest('hex');
}

function resumirEntradas(entradas) {
  const prefixos = new Set();
  let ignoradas = 0;

  for (const entrada of entradas) {
    const sufixo = SUFIXOS.find(([valor]) => entrada.nome.endsWith(valor));
    if (!sufixo) {
      ignoradas += 1;
      continue;
    }
    prefixos.add(entrada.nome.slice(0, -sufixo[0].length));
  }

  return { prefixos: [...prefixos].sort(), ignoradas };
}

async function* gruposDoArquivo({ formato, caminhoArquivo, entradas }) {
  const pendentes = new Map();

  const fluxo =
    formato === '7z'
      ? lerEntradas7z(caminhoArquivo, entradas)
      : (function* () {
          for (const entrada of entradas) yield { entrada };
        })();

  for await (const { entrada, conteudo: dados } of fluxo) {
    const sufixo = SUFIXOS.find(([valor]) => entrada.nome.endsWith(valor));
    if (!sufixo) continue;

    const prefixo = entrada.nome.slice(0, -sufixo[0].length);
    const grupo = pendentes.get(prefixo) ?? {};
    grupo[sufixo[1]] = Object.assign(entrada, { conteudo: dados });

    // O TSE intercala entradas de seções vizinhas nos arquivos de 2º turno.
    if (Object.keys(grupo).length === 3) {
      pendentes.delete(prefixo);
      yield { prefixo, grupo };
    } else {
      pendentes.set(prefixo, grupo);
    }
  }

  if (pendentes.size > 0) {
    for (const [prefixo, grupo] of pendentes) yield { prefixo, grupo };
  }
}

function descricaoDaJanela(janela, totalEventos) {
  if (!janela.identificada) {
    return {
      tipo: 'JANELA_NAO_IDENTIFICADA',
      descricao:
        'O log não tem URNA_PRONTA e ENCERRAMENTO nos horários de abertura e encerramento do BU; nenhum evento foi filtrado.',
      impacto: `${totalEventos} eventos do log usados sem filtro.`,
    };
  }
  return {
    tipo: 'JANELA_TURNO',
    descricao:
      'Eventos do log fora do intervalo entre a abertura e o encerramento do BU foram excluídos de eleitores, incidentes e conferência.',
    impacto: `${janela.fora} de ${totalEventos} eventos excluídos (${janela.votosFora} votos computados), de ${janela.primeiroFora} a ${janela.ultimoFora}.`,
  };
}

async function inserirSecao(trx, grupo, extrair, destino, contexto) {
  const conteudoBu = await extrair(grupo.bu);
  const bu = lerFonte('BU', () => decodificarBu(conteudoBu));
  const cdMunicipio = bu.localidade.municipio;
  const localizacaoErro = {
    cd_municipio_tse: cdMunicipio,
    nr_zona: bu.localidade.zona,
    nr_secao: bu.localidade.secao,
  };
  const nomes = await carregarMunicipios();
  const nomeMunicipio = nomes.get(`${destino.sg_uf}:${cdMunicipio}`) ?? `MUNICÍPIO ${cdMunicipio}`;

  const chaveMunicipio = `${destino.sg_uf}:${cdMunicipio}`;
  if (!contexto.municipiosGravados.has(chaveMunicipio)) {
    await trx
      .insertInto('localidade')
      .values({ sg_uf: destino.sg_uf, cd_municipio_tse: cdMunicipio, nm_municipio: nomeMunicipio })
      .onConflict((oc) => oc.columns(['sg_uf', 'cd_municipio_tse']).doNothing())
      .execute();
  }

  const secao = await trx
    .insertInto('totalizacao_secao')
    .values({
      lote_id: destino.lote_id,
      prefixo: destino.prefixo,
      ano_eleicao: destino.ano_eleicao,
      nr_turno: destino.nr_turno,
      sg_uf: destino.sg_uf,
      cd_municipio_tse: cdMunicipio,
      nr_zona: bu.localidade.zona,
      nr_secao: bu.localidade.secao,
      nr_urna_efetivada: bu.urna,
      nr_local_votacao: bu.localidade.local,
      qt_aptos: bu.cargos[0].aptos,
      qt_comparecimento: bu.comparecimento,
      qt_abstencoes: bu.cargos[0].aptos - bu.comparecimento,
      dt_abertura: instanteBu(bu.abertura),
      dt_encerramento: instanteBu(bu.encerramento),
      dt_emissao_bu: instanteBu(bu.dataHora),
      qt_habilitacao_1: bu.habilitacao1,
      qt_habilitacao_2: bu.habilitacao2,
      qt_habilitacao_3: bu.habilitacao3,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  const localizacao = {
    sgUf: destino.sg_uf,
    cdMunicipioTse: cdMunicipio,
    nrZona: bu.localidade.zona,
    nrSecao: bu.localidade.secao,
  };
  const votosBu = votosDoBu(bu).filter(
    (voto) => voto.cd_cargo_pergunta === 1 || voto.cd_cargo_pergunta === 3,
  );
  if (votosBu.length > 0) {
    await trx
      .insertInto('totalizacao_bu_voto')
      .values(votosBu.map((voto) => ({ totalizacao_secao_id: secao.id, ...voto })))
      .execute();
  }

  const conteudoRdv = grupo.rdv ? await extrair(grupo.rdv) : null;
  const votosRdv = grupo.rdv
    ? lerFonte('RDV', () => decodificarRdv(conteudoRdv), localizacaoErro)
        .filter((voto) => voto.cargo === 1 || voto.cargo === 3)
        .map((voto) => ({
          totalizacao_secao_id: secao.id,
          cd_cargo_pergunta: voto.cargo,
          cd_tipo_votavel: voto.tipo,
          nr_votavel: voto.numero,
          qt_votos: voto.quantidade,
        }))
    : [];
  if (votosRdv.length > 0) {
    await trx.insertInto('totalizacao_rdv_voto').values(votosRdv).execute();
  }

  if (grupo.rdv) {
    await registrarDivergencias(
      trx,
      destino.lote_id,
      conferirBuRdv({ buVotos: votosBu, rdvVotos: votosRdv, ...localizacao }),
    );
  }

  if (grupo.log) {
    const conteudoLog = await extrair(grupo.log);
    const todosEventos = lerFonte('LOG', () => parsearLogJez(conteudoLog), localizacaoErro);
    const janela = janelaDoBu(todosEventos, bu);
    const eventos = janela.eventos;
    if (!janela.identificada || janela.fora > 0) {
      await registrarIntervencao(trx, {
        loteId: destino.lote_id,
        prefixo: destino.prefixo,
        fonte: 'LOG',
        posicao: `${janela.abertura} a ${janela.encerramento}`,
        ...descricaoDaJanela(janela, todosEventos.length),
      });
    }
    const semPar = contarSemPar(eventos);
    if (semPar.habilitacoesSemVoto > 0 || semPar.votosSemHabilitacao > 0) {
      await registrarIntervencao(trx, {
        loteId: destino.lote_id,
        prefixo: destino.prefixo,
        fonte: 'LOG',
        tipo: 'ELEITOR_SEM_PAR',
        descricao:
          'Habilitações sem voto computado e votos computados sem habilitação não entram nas métricas por eleitor.',
        impacto: `${semPar.habilitacoesSemVoto} habilitações sem voto; ${semPar.votosSemHabilitacao} votos sem habilitação.`,
      });
    }
    await registrarEleitores(trx, secao.id, eventos);
    await registrarIncidentes(trx, secao.id, eventos);
    await registrarDivergencias(
      trx,
      destino.lote_id,
      conferirBuLog({ bu, eventos, ...localizacao }),
    );
  }

  await conferirBuBweb(trx, {
    loteId: destino.lote_id,
    anoEleicao: destino.ano_eleicao,
    nrTurno: destino.nr_turno,
    votosBu,
    bwebDaUf: contexto.bwebDaUf,
    ...localizacao,
  });

  return { votosBu: votosBu.length, votosRdv: votosRdv.length, municipio: chaveMunicipio };
}

async function retomarLote(db, existente, destino) {
  return db
    .updateTable('totalizacao_lote')
    .set({
      nome_arquivo: destino.nome_arquivo,
      sg_uf: destino.sg_uf,
      ano_eleicao: destino.ano_eleicao,
      nr_turno: destino.nr_turno,
      iniciado_em: new Date(),
      concluido_em: null,
      status: 'processando',
      substituido_por: null,
    })
    .where('id', '=', existente.id)
    .returning('id')
    .executeTakeFirstOrThrow();
}

async function reiniciarLote(db, existente, destino, sha256) {
  await db
    .updateTable('totalizacao_lote')
    .set({ substituido_por: null })
    .where('substituido_por', '=', existente.id)
    .execute();
  await db.deleteFrom('totalizacao_secao').where('lote_id', '=', existente.id).execute();
  await db.deleteFrom('totalizacao_lote').where('id', '=', existente.id).execute();
  return db
    .insertInto('totalizacao_lote')
    .values({ ...destino, sha256, status: 'processando' })
    .returning('id')
    .executeTakeFirstOrThrow();
}

async function carregarSecoesDoLote(db, loteId) {
  const [secoes, erros] = await Promise.all([
    db
      .selectFrom('totalizacao_secao')
      .select('prefixo')
      .where('lote_id', '=', loteId)
      .where('prefixo', 'is not', null)
      .execute(),
    db
      .selectFrom('totalizacao_secao_erro')
      .select('prefixo')
      .where('lote_id', '=', loteId)
      .execute(),
  ]);

  return {
    gravadas: new Set(secoes.map((secao) => secao.prefixo)),
    comErro: new Set(erros.map((erro) => erro.prefixo)),
  };
}

async function registrarSecaoErro(db, { loteId, sgUf, prefixo }, erro) {
  const registro = {
    codigo: erro.codigo ?? CODIGO_INTERNO,
    mensagem: erro.message,
    registrado_em: new Date(),
    ...(erro.localizacao ?? {}),
  };

  await db
    .insertInto('totalizacao_secao_erro')
    .values({ lote_id: loteId, sg_uf: sgUf, prefixo, ...registro })
    .onConflict((oc) => oc.columns(['lote_id', 'prefixo']).doUpdateSet(registro))
    .execute();
}

async function contarSecoesComErro(db, loteId) {
  const linha = await db
    .selectFrom('totalizacao_secao_erro')
    .select((eb) => eb.fn.countAll().as('total'))
    .where('lote_id', '=', loteId)
    .executeTakeFirstOrThrow();
  return Number(linha.total);
}

async function finalizarLote(db, loteId, origem, status) {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('totalizacao_lote')
      .set({ status, concluido_em: new Date() })
      .where('id', '=', loteId)
      .execute();

    await trx
      .updateTable('totalizacao_lote')
      .set({ status: 'substituido', substituido_por: loteId })
      .where('sg_uf', '=', origem.sg_uf)
      .where('ano_eleicao', '=', origem.ano_eleicao)
      .where('nr_turno', '=', origem.nr_turno)
      .where('id', '!=', loteId)
      .where('status', '!=', 'substituido')
      .execute();
  });
}

export async function carregarZip(db, caminhoArquivo, opcoes = {}) {
  const formato = await detectarFormatoArquivo(caminhoArquivo);
  if (formato !== 'zip') {
    return carregarZipAberto(db, caminhoArquivo, { formato, zip: null }, opcoes);
  }

  const zip = await abrirZipArquivo(caminhoArquivo);
  try {
    return await carregarZipAberto(db, caminhoArquivo, { formato, zip }, opcoes);
  } finally {
    await zip.fechar();
  }
}

async function carregarZipAberto(
  db,
  caminhoArquivo,
  { formato, zip },
  {
    aoProgredir,
    registrarEvento = registrarEventoCarga,
    falharRapido = false,
    retomar = false,
    concorrencia = 1,
  } = {},
) {
  const inicio = Date.now();
  const nomeArquivo = path.basename(caminhoArquivo);
  const sha256 = await hashArquivo(caminhoArquivo);

  const existente = await db
    .selectFrom('totalizacao_lote')
    .select(['id', 'status'])
    .where('sha256', '=', sha256)
    .executeTakeFirst();
  if (existente?.status === 'concluido') {
    registrarEvento('lote_ignorado', {
      arquivo: nomeArquivo,
      lote_id: existente.id,
      motivo: 'sha256',
      status: existente.status,
    });
    return { ignorado: true, motivo: 'sha256' };
  }

  const origem = derivarOrigem(nomeArquivo);
  const entradas = formato === '7z' ? await listarEntradas7z(caminhoArquivo) : zip.entradas;
  const { prefixos, ignoradas } = resumirEntradas(entradas);
  if (prefixos.length === 0) throw new Error(`arquivo sem entradas de seção: ${nomeArquivo}`);
  const extrair =
    formato === '7z' ? (entrada) => entrada.conteudo : (entrada) => zip.extrair(entrada);

  const destino = { ...origem, nome_arquivo: nomeArquivo };
  const lote = existente
    ? retomar
      ? await retomarLote(db, existente, destino)
      : await reiniciarLote(db, existente, destino, sha256)
    : await db
        .insertInto('totalizacao_lote')
        .values({ ...destino, sha256, status: 'processando' })
        .returning('id')
        .executeTakeFirstOrThrow();

  const contexto = {
    arquivo: nomeArquivo,
    uf: origem.sg_uf,
    ano: origem.ano_eleicao,
    turno: origem.nr_turno,
    lote_id: lote.id,
  };
  registrarEvento('lote_iniciado', { ...contexto, status: 'processando' });

  let secaoAtual = null;

  try {
    let votosBu = 0;
    let votosRdv = 0;
    let secoesSemRdv = 0;
    let secoesSemLog = 0;
    let secoesIgnoradas = 0;

    await aoProgredir?.({ etapa: 'lote', loteId: lote.id, atual: 0, total: prefixos.length });

    const { gravadas, comErro } = await carregarSecoesDoLote(db, lote.id);
    const contextoSecao = {
      municipiosGravados: new Set(),
      bwebDaUf: await existeBwebDaUf(db, {
        anoEleicao: origem.ano_eleicao,
        nrTurno: origem.nr_turno,
        sgUf: origem.sg_uf,
      }),
    };

    let indice = 0;
    let falhaFatal = null;
    const emVoo = new Set();

    const processar = async (prefixo, grupo) => {
      try {
        const resultado = await db.transaction().execute(async (trx) => {
          const inserido = await inserirSecao(
            trx,
            grupo,
            extrair,
            { ...destino, lote_id: lote.id, prefixo },
            contextoSecao,
          );
          if (comErro.has(prefixo)) {
            await trx
              .deleteFrom('totalizacao_secao_erro')
              .where('lote_id', '=', lote.id)
              .where('prefixo', '=', prefixo)
              .execute();
          }
          return inserido;
        });

        contextoSecao.municipiosGravados.add(resultado.municipio);
        votosBu += resultado.votosBu;
        votosRdv += resultado.votosRdv;
      } catch (erro) {
        if (falharRapido) {
          falhaFatal ??= erro;
          return;
        }
        registrarEvento('secao_falhou', {
          ...contexto,
          secao: prefixo,
          prefixo,
          erro_codigo: erro.codigo ?? CODIGO_INTERNO,
          erro_mensagem: erro.message,
        });
        await registrarSecaoErro(db, { loteId: lote.id, sgUf: origem.sg_uf, prefixo }, erro);
      }

      await aoProgredir?.({
        etapa: 'secao',
        loteId: lote.id,
        prefixo,
        atual: indice,
        total: prefixos.length,
      });
    };

    for await (const { prefixo, grupo } of gruposDoArquivo({
      formato,
      caminhoArquivo,
      entradas,
    })) {
      if (falhaFatal) break;
      indice += 1;
      if (!grupo.rdv) secoesSemRdv += 1;
      if (!grupo.log) secoesSemLog += 1;

      if (!comErro.has(prefixo) && gravadas.has(prefixo)) {
        secoesIgnoradas += 1;
        continue;
      }

      secaoAtual = prefixo;

      if (!grupo.bu) {
        secoesIgnoradas += 1;
        continue;
      }

      const tarefa = processar(prefixo, grupo).finally(() => emVoo.delete(tarefa));
      emVoo.add(tarefa);
      if (emVoo.size >= concorrencia) await Promise.race(emVoo);
    }

    await Promise.all(emVoo);
    if (falhaFatal) throw falhaFatal;

    if (indice !== prefixos.length) {
      throw new Error(
        `arquivo ${nomeArquivo} devolveu ${indice} seções, esperado ${prefixos.length}`,
      );
    }

    const secoesComErro = await contarSecoesComErro(db, lote.id);
    const status = secoesComErro > 0 ? 'parcial' : 'concluido';
    await finalizarLote(db, lote.id, origem, status);

    registrarEvento('lote_concluido', {
      ...contexto,
      duracao_ms: Date.now() - inicio,
      secoes: prefixos.length,
      secoes_com_erro: secoesComErro,
      secoes_ignoradas: secoesIgnoradas,
      votos_bu: votosBu,
      votos_rdv: votosRdv,
      status,
    });

    return {
      ignorado: false,
      lote_id: lote.id,
      nome_arquivo: nomeArquivo,
      ...origem,
      status,
      secoes: prefixos.length,
      secoes_processadas: prefixos.length - secoesIgnoradas,
      secoes_ignoradas: secoesIgnoradas,
      secoes_com_erro: secoesComErro,
      votos_bu: votosBu,
      votos_rdv: votosRdv,
      secoes_sem_rdv: secoesSemRdv,
      secoes_sem_log: secoesSemLog,
      arquivos_ignorados: ignoradas,
    };
  } catch (erro) {
    registrarEvento('lote_falhou', {
      ...contexto,
      secao: secaoAtual,
      duracao_ms: Date.now() - inicio,
      erro_codigo: erro.codigo ?? CODIGO_INTERNO,
      erro_mensagem: erro.message,
      status: 'falhou',
    });
    await db
      .updateTable('totalizacao_lote')
      .set({ status: 'falhou' })
      .where('id', '=', lote.id)
      .execute()
      .catch(() => {});
    throw erro;
  }
}
