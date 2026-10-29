import { sql } from 'kysely';
import { categorizar } from '../apuracao/categoria-votavel.js';
import { hashConteudoBu, montarConteudoBu } from './conteudo-bu.js';
import { dataOrigem, instanteOrigemSql, localOrigem } from '../../lib/datas.js';

export function chaveGrupo(valores) {
  return [
    valores.ANO_ELEICAO,
    valores.CD_PLEITO,
    valores.CD_ELEICAO,
    valores.NR_TURNO,
    valores.SG_UF,
    valores.CD_MUNICIPIO,
    valores.NR_ZONA,
    valores.NR_SECAO,
    valores.CD_CARGO_PERGUNTA,
  ].join('|');
}

async function upsertEleicao(trx, valores, metadadosDerivados) {
  return trx
    .insertInto('eleicao')
    .values({
      ano_eleicao: valores.ANO_ELEICAO,
      cd_pleito: valores.CD_PLEITO,
      cd_eleicao: valores.CD_ELEICAO,
      nr_turno: valores.NR_TURNO,
      dt_pleito: dataOrigem(valores.DT_PLEITO),
      dt_eleicao: dataOrigem(valores.DT_ELEICAO),
      cd_tipo_eleicao: valores.CD_TIPO_ELEICAO ?? null,
      nm_tipo_eleicao: valores.NM_TIPO_ELEICAO ?? null,
      ds_eleicao: valores.DS_ELEICAO ?? null,
      metadados_derivados: metadadosDerivados,
    })
    .onConflict((oc) =>
      oc.columns(['ano_eleicao', 'cd_pleito', 'cd_eleicao', 'nr_turno']).doUpdateSet({
        dt_pleito: sql`coalesce(eleicao.dt_pleito, excluded.dt_pleito)`,
        dt_eleicao: sql`coalesce(eleicao.dt_eleicao, excluded.dt_eleicao)`,
        cd_tipo_eleicao: sql`coalesce(eleicao.cd_tipo_eleicao, excluded.cd_tipo_eleicao)`,
        nm_tipo_eleicao: sql`coalesce(eleicao.nm_tipo_eleicao, excluded.nm_tipo_eleicao)`,
        ds_eleicao: sql`coalesce(eleicao.ds_eleicao, excluded.ds_eleicao)`,
        metadados_derivados: sql`case when cardinality(eleicao.metadados_derivados) = 0 then excluded.metadados_derivados else eleicao.metadados_derivados end`,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow();
}

async function upsertLocalidade(trx, valores) {
  await trx
    .insertInto('localidade')
    .values({
      sg_uf: valores.SG_UF,
      cd_municipio_tse: valores.CD_MUNICIPIO,
      nm_municipio: valores.NM_MUNICIPIO,
    })
    .onConflict((oc) => oc.columns(['sg_uf', 'cd_municipio_tse']).doNothing())
    .execute();
}

async function upsertSecao(trx, valores) {
  return trx
    .insertInto('secao_eleitoral')
    .values({
      ano_eleicao: valores.ANO_ELEICAO,
      cd_pleito: valores.CD_PLEITO,
      nr_turno: valores.NR_TURNO,
      sg_uf: valores.SG_UF,
      cd_municipio_tse: valores.CD_MUNICIPIO,
      nr_zona: valores.NR_ZONA,
      nr_secao: valores.NR_SECAO,
      nr_local_votacao: valores.NR_LOCAL_VOTACAO ?? null,
      ds_secoes_agregadas: valores.DS_SECOES_AGREGADAS ?? null,
    })
    .onConflict((oc) =>
      oc
        .columns(['ano_eleicao', 'cd_pleito', 'nr_turno', 'sg_uf', 'cd_municipio_tse', 'nr_zona', 'nr_secao'])
        .doUpdateSet({
          nr_local_votacao: sql`coalesce(excluded.nr_local_votacao, secao_eleitoral.nr_local_votacao)`,
          ds_secoes_agregadas: sql`coalesce(excluded.ds_secoes_agregadas, secao_eleitoral.ds_secoes_agregadas)`,
        }),
    )
    .returning('id')
    .executeTakeFirstOrThrow();
}

function valoresBoletim(valores, { eleicaoId, secaoId, loteId, versao, ativo, substituiVersaoId, conteudoSha256 }) {
  const recebido = valores.DT_BU_RECEBIDO;
  return {
    eleicao_id: eleicaoId,
    secao_id: secaoId,
    cd_cargo_pergunta: valores.CD_CARGO_PERGUNTA,
    ds_cargo_pergunta: valores.DS_CARGO_PERGUNTA,
    lote_id: loteId,
    versao,
    ativo,
    substitui_versao_id: substituiVersaoId,
    conteudo_sha256: conteudoSha256,
    dt_geracao: instanteOrigemSql(localOrigem(valores.DT_GERACAO)),
    dt_abertura: instanteOrigemSql(localOrigem(valores.DT_ABERTURA)),
    dt_encerramento: instanteOrigemSql(localOrigem(valores.DT_ENCERRAMENTO)),
    dt_emissao_bu: instanteOrigemSql(localOrigem(valores.DT_EMISSAO_BU)),
    dt_bu_recebido_ts: recebido?.precisao === 'DATA_HORA' ? instanteOrigemSql(recebido.local) : null,
    dt_bu_recebido_data: recebido?.precisao === 'DATA' ? recebido.data : null,
    precisao_dt_bu_recebido: recebido?.precisao ?? 'AUSENTE',
    qt_aptos: valores.QT_APTOS ?? null,
    qt_comparecimento: valores.QT_COMPARECIMENTO ?? null,
    qt_abstencoes: valores.QT_ABSTENCOES ?? null,
    qt_elei_biom_sem_habilitacao: valores.QT_ELEI_BIOM_SEM_HABILITACAO ?? null,
    cd_tipo_urna: valores.CD_TIPO_URNA ?? null,
    ds_tipo_urna: valores.DS_TIPO_URNA ?? null,
    nr_urna_efetivada: valores.NR_URNA_EFETIVADA ?? null,
    cd_carga_1_urna_efetivada: valores.CD_CARGA_1_URNA_EFETIVADA ?? null,
    cd_carga_2_urna_efetivada: valores.CD_CARGA_2_URNA_EFETIVADA ?? null,
    cd_flashcard_urna_efetivada: valores.CD_FLASHCARD_URNA_EFETIVADA ?? null,
    dt_carga_urna_efetivada: valores.DT_CARGA_URNA_EFETIVADA ?? null,
    nr_junta_apuradora: valores.NR_JUNTA_APURADORA ?? null,
    nr_turma_apuradora: valores.NR_TURMA_APURADORA ?? null,
  };
}

export async function persistirArquivo(trx, { loteId, registros, metadadosDerivados = [] }) {
  const grupos = new Map();
  for (const registro of registros) {
    const chave = chaveGrupo(registro.valores);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(registro);
  }

  const eleicoes = new Map();
  const secoes = new Map();
  let importados = 0;

  for (const registrosBu of grupos.values()) {
    const valores = registrosBu[0].valores;
    const chaveEleicao = [valores.ANO_ELEICAO, valores.CD_PLEITO, valores.CD_ELEICAO, valores.NR_TURNO].join('|');

    let eleicaoId = eleicoes.get(chaveEleicao);
    if (!eleicaoId) {
      eleicaoId = (await upsertEleicao(trx, valores, metadadosDerivados)).id;
      eleicoes.set(chaveEleicao, eleicaoId);
    }

    await upsertLocalidade(trx, valores);

    const chaveSecao = chaveGrupo(valores);
    let secaoId = secoes.get(chaveSecao);
    if (!secaoId) {
      secaoId = (await upsertSecao(trx, valores)).id;
      secoes.set(chaveSecao, secaoId);
    }

    const votaveis = registrosBu.map((registro) => ({
      cd_tipo_votavel: registro.valores.CD_TIPO_VOTAVEL,
      nr_votavel: registro.valores.NR_VOTAVEL,
      nm_votavel: registro.valores.NM_VOTAVEL,
      nr_partido: registro.valores.NR_PARTIDO,
      sg_partido: registro.valores.SG_PARTIDO,
      nm_partido: registro.valores.NM_PARTIDO,
      qt_votos: registro.valores.QT_VOTOS,
    }));

    const conteudo = montarConteudoBu({ valores, votaveis });
    const hash = hashConteudoBu(conteudo);

    const ativa = await trx
      .selectFrom('boletim_versao')
      .select(['id', 'versao', 'conteudo_sha256'])
      .where('eleicao_id', '=', eleicaoId)
      .where('secao_id', '=', secaoId)
      .where('cd_cargo_pergunta', '=', valores.CD_CARGO_PERGUNTA)
      .where('ativo', '=', true)
      .executeTakeFirst();

    if (ativa && ativa.conteudo_sha256 === hash) continue;

    let versao = 1;
    let substituiVersaoId = null;
    if (ativa) {
      versao = ativa.versao + 1;
      substituiVersaoId = ativa.id;
      await trx.updateTable('boletim_versao').set({ ativo: false }).where('id', '=', ativa.id).execute();
    }

    const boletim = await trx
      .insertInto('boletim_versao')
      .values(
        valoresBoletim(valores, {
          eleicaoId,
          secaoId,
          loteId,
          versao,
          ativo: true,
          substituiVersaoId,
          conteudoSha256: hash,
        }),
      )
      .returning('id')
      .executeTakeFirstOrThrow();

    const linhas = registrosBu.map((registro) => ({
      boletim_versao_id: boletim.id,
      cd_tipo_votavel: registro.valores.CD_TIPO_VOTAVEL,
      ds_tipo_votavel: registro.valores.DS_TIPO_VOTAVEL ?? null,
      categoria: categorizar({
        cd_tipo_votavel: registro.valores.CD_TIPO_VOTAVEL,
        ds_tipo_votavel: registro.valores.DS_TIPO_VOTAVEL,
        nr_votavel: registro.valores.NR_VOTAVEL,
      }),
      nr_votavel: registro.valores.NR_VOTAVEL,
      nm_votavel: registro.valores.NM_VOTAVEL ?? null,
      nr_partido: registro.valores.NR_PARTIDO ?? null,
      sg_partido: registro.valores.SG_PARTIDO ?? null,
      nm_partido: registro.valores.NM_PARTIDO ?? null,
      qt_votos: registro.valores.QT_VOTOS ?? null,
      lote_id: loteId,
      nr_linha_origem: registro.nrLinha,
      ano_eleicao: registro.valores.ANO_ELEICAO,
      nr_turno: registro.valores.NR_TURNO,
      sg_uf: registro.valores.SG_UF,
      cd_municipio_tse: registro.valores.CD_MUNICIPIO,
      nr_zona: registro.valores.NR_ZONA,
      nr_secao: registro.valores.NR_SECAO,
      cd_cargo_pergunta: registro.valores.CD_CARGO_PERGUNTA,
    }));

    for (let i = 0; i < linhas.length; i += 500) {
      await trx.insertInto('resultado_votavel').values(linhas.slice(i, i + 500)).execute();
    }
    importados += linhas.length;

    if (substituiVersaoId) {
      await trx
        .insertInto('alerta_importacao')
        .values({
          lote_id: loteId,
          severidade: 'alerta',
          codigo: 'VERSAO_BU_CONFLITANTE',
          mensagem: 'Nova versão do BU substituiu a anterior',
          contexto: { versaoAnteriorId: substituiVersaoId, versaoNovaId: boletim.id },
        })
        .execute();
    }
  }

  return { importados };
}
