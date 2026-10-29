export const STATUS_SECAO = Object.freeze({
  sem_bu: {
    rotulo: 'Sem BU',
    tom: 'neutral',
    descricao: 'Nenhum boletim de urna recebido para esta seção.',
  },
  encerrada_aguardando_bu: {
    rotulo: 'Encerrada, aguardando BU',
    tom: 'warning',
    descricao: 'A seção encerrou, mas o BU ainda não foi recebido no corte atual.',
  },
  bu_recebido: {
    rotulo: 'BU recebido',
    tom: 'success',
    descricao: 'Boletim de urna recebido e considerado no corte atual.',
  },
  nao_apurada: {
    rotulo: 'Não apurada',
    tom: 'neutral',
    descricao: 'Seção não apurada segundo o tipo de urna informado.',
  },
  anulada_apurada_separado: {
    rotulo: 'Anulada, apurada em separado',
    tom: 'warning',
    descricao: 'Seção anulada com apuração realizada em separado.',
  },
  anulada: {
    rotulo: 'Anulada',
    tom: 'danger',
    descricao: 'Seção anulada.',
  },
  nao_instalada: {
    rotulo: 'Não instalada',
    tom: 'neutral',
    descricao: 'Seção não instalada.',
  },
  desconhecido: {
    rotulo: 'Desconhecido',
    tom: 'danger',
    descricao: 'Status não reconhecido ou metadados insuficientes.',
  },
})

export const MOTIVOS = Object.freeze({
  PRECISAO_INSUFICIENTE: 'A data de recebimento do BU não tem precisão suficiente para este corte.',
  HORARIOS_INCONSISTENTES: 'Os horários do BU são inconsistentes.',
  TIPO_URNA_AUSENTE: 'O tipo de urna não foi informado.',
  CORTE_INVALIDO: 'O corte informado não pôde ser aplicado.',
})

export const AVISOS = Object.freeze({
  PRECISAO_INSUFICIENTE: {
    rotulo: 'Precisão insuficiente',
    tom: 'warning',
  },
  CORTE_INDISPONIVEL: {
    rotulo: 'Corte indisponível',
    tom: 'warning',
  },
  METADADOS_DERIVADOS: {
    rotulo: 'Metadados derivados',
    tom: 'info',
  },
})

export function statusSecao(status) {
  return (
    STATUS_SECAO[status] ?? {
      rotulo: status || 'Desconhecido',
      tom: 'neutral',
      descricao: 'Status não reconhecido pela interface.',
    }
  )
}

export function motivoSecao(motivo) {
  if (!motivo) return null
  return MOTIVOS[motivo] ?? motivo
}

export function avisoInfo(codigo) {
  return (
    AVISOS[codigo] ?? {
      rotulo: codigo || 'Aviso',
      tom: 'info',
    }
  )
}

export function opcoesStatus() {
  return Object.entries(STATUS_SECAO).map(([valor, info]) => ({
    valor,
    rotulo: info.rotulo,
  }))
}
