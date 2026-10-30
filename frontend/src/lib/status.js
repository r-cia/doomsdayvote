import i18n from '../i18n'

const STATUS_KEYS = {
  sem_bu: 'status.semBu',
  aguardando_bu: 'status.aguardandoBu',
  bu_recebido: 'status.buRecebido',
  nao_apurada: 'status.naoApurada',
  anulada_apurada_separado: 'status.anuladaApuradaSeparado',
  anulada: 'status.anulada',
  nao_instalada: 'status.naoInstalada',
  desconhecido: 'status.desconhecido',
}

export const STATUS_SECAO = Object.freeze({
  sem_bu: { tom: 'neutral' },
  aguardando_bu: { tom: 'warning' },
  bu_recebido: { tom: 'success' },
  nao_apurada: { tom: 'neutral' },
  anulada_apurada_separado: { tom: 'warning' },
  anulada: { tom: 'danger' },
  nao_instalada: { tom: 'neutral' },
  desconhecido: { tom: 'danger' },
})

export const MOTIVOS = Object.freeze({
  PRECISAO_INSUFICIENTE: 'status.precisaoInsuficiente',
  HORARIOS_INCONSISTENTES: 'status.horariosInconsistentes',
  TIPO_URNA_AUSENTE: 'status.tipoUrnaAusente',
  CORTE_INVALIDO: 'status.corteInvalido',
})

export const AVISOS = Object.freeze({
  PRECISAO_INSUFICIENTE: { tom: 'warning' },
  CORTE_INDISPONIVEL: { tom: 'warning' },
  METADADOS_DERIVADOS: { tom: 'info' },
})

export function statusSecao(status) {
  const key = STATUS_KEYS[status] ?? STATUS_KEYS.desconhecido
  const base = STATUS_SECAO[status] ?? STATUS_SECAO.desconhecido
  return {
    rotulo: i18n.global.t(key),
    tom: base.tom,
    descricao: i18n.global.t('status.naoReconhecido'),
  }
}

export function motivoSecao(motivo) {
  if (!motivo) return null
  const key = MOTIVOS[motivo]
  return key ? i18n.global.t(key) : motivo
}

export function avisoInfo(codigo) {
  const base = AVISOS[codigo] ?? { tom: 'info' }
  const key = `avisos.${codigo}`
  let rotulo = codigo || 'Aviso'
  try {
    const t = i18n.global.t(key)
    if (t && t !== key) rotulo = t
  } catch (e) {}
  // fallback to avisos rotulo map
  const rotulos = {
    PRECISAO_INSUFICIENTE: i18n.global.t('avisos.precisaoInsuficiente'),
    CORTE_INDISPONIVEL: i18n.global.t('avisos.corteIndisponivel'),
    METADADOS_DERIVADOS: i18n.global.t('avisos.metadadosDerivados'),
  }
  if (rotulos[codigo]) rotulo = rotulos[codigo]
  return {
    rotulo,
    tom: base.tom,
  }
}

export function opcoesStatus() {
  return Object.keys(STATUS_KEYS).map((valor) => ({
    valor,
    rotulo: i18n.global.t(STATUS_KEYS[valor]),
  }))
}