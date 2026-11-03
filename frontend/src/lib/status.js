import { t } from '../i18n'

const TONS = Object.freeze({
  sem_bu: 'neutral',
  encerrada_aguardando_bu: 'warning',
  bu_recebido: 'success',
  nao_apurada: 'neutral',
  anulada_apurada_separado: 'warning',
  anulada: 'danger',
  nao_instalada: 'neutral',
  desconhecido: 'danger',
})

const MOTIVOS = Object.freeze([
  'PRECISAO_INSUFICIENTE',
  'HORARIOS_INCONSISTENTES',
  'TIPO_URNA_AUSENTE',
  'CORTE_INVALIDO',
])

const TONS_AVISO = Object.freeze({
  PRECISAO_INSUFICIENTE: 'warning',
  CORTE_INDISPONIVEL: 'warning',
  METADADOS_DERIVADOS: 'info',
})

export function statusSecao(status) {
  if (status in TONS) {
    return { rotulo: t(`status.${status}.rotulo`), tom: TONS[status], descricao: t(`status.${status}.descricao`) }
  }
  return { rotulo: status || t('status.desconhecido.rotulo'), tom: 'neutral', descricao: t('status.naoReconhecido') }
}

export function motivoSecao(motivo) {
  if (!motivo) return null
  return MOTIVOS.includes(motivo) ? t(`status.motivos.${motivo}`) : motivo
}

export function avisoInfo(codigo) {
  if (codigo in TONS_AVISO) return { rotulo: t(`avisos.rotulo.${codigo}`), tom: TONS_AVISO[codigo] }
  return { rotulo: codigo || t('avisos.generico'), tom: 'info' }
}

export function opcoesStatus() {
  return Object.keys(TONS).map((valor) => ({ valor, rotulo: t(`status.${valor}.rotulo`) }))
}
