import { createHash } from 'node:crypto';

function ordenarChaves(valor) {
  if (Array.isArray(valor)) return valor.map(ordenarChaves);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((chave) => [chave, ordenarChaves(valor[chave])]),
    );
  }
  return valor;
}

function dataHora(valor) {
  if (!valor) return null;
  return { precisao: valor.precisao, local: valor.local ?? null, data: valor.data ?? null };
}

export function montarConteudoBu({ valores, votaveis }) {
  return {
    dt_abertura: dataHora(valores.DT_ABERTURA),
    dt_encerramento: dataHora(valores.DT_ENCERRAMENTO),
    dt_emissao_bu: dataHora(valores.DT_EMISSAO_BU),
    dt_bu_recebido: dataHora(valores.DT_BU_RECEBIDO),
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
    votaveis: votaveis
      .map((votavel) => ({
        cd_tipo_votavel: votavel.cd_tipo_votavel,
        nr_votavel: votavel.nr_votavel,
        nm_votavel: votavel.nm_votavel ?? null,
        nr_partido: votavel.nr_partido ?? null,
        sg_partido: votavel.sg_partido ?? null,
        nm_partido: votavel.nm_partido ?? null,
        qt_votos: votavel.qt_votos ?? null,
      }))
      .sort((a, b) => a.cd_tipo_votavel - b.cd_tipo_votavel || a.nr_votavel - b.nr_votavel),
  };
}

export function hashConteudoBu(conteudo) {
  return createHash('sha256').update(JSON.stringify(ordenarChaves(conteudo))).digest('hex');
}
