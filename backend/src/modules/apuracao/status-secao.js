const FUSO = 'America/Sao_Paulo';

const STATUS_POR_TIPO_URNA = {
  2: 'nao_apurada',
  3: 'anulada_apurada_separado',
  4: 'anulada',
  5: 'nao_instalada',
};

function iso(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function diaEmSaoPaulo(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(data);
}

function horarios(bu) {
  if (!bu) {
    return {
      dt_abertura: null,
      dt_encerramento: null,
      dt_emissao_bu: null,
      dt_bu_recebido: null,
      precisao_dt_bu_recebido: null,
    };
  }

  const precisao = bu.precisao_dt_bu_recebido ?? 'AUSENTE';
  const recebido =
    precisao === 'DATA_HORA'
      ? iso(bu.dt_bu_recebido_ts)
      : precisao === 'DATA'
        ? bu.dt_bu_recebido_data ?? null
        : null;

  return {
    dt_abertura: iso(bu.dt_abertura),
    dt_encerramento: iso(bu.dt_encerramento),
    dt_emissao_bu: iso(bu.dt_emissao_bu),
    dt_bu_recebido: recebido,
    precisao_dt_bu_recebido: precisao,
  };
}

function resultado(status, motivo, bu) {
  return { status, motivo: motivo ?? null, horarios: horarios(bu) };
}

export function classificarStatusSecao(bu, corte) {
  if (!bu) return resultado('sem_bu', null, null);

  const tipo = bu.cd_tipo_urna;

  if (STATUS_POR_TIPO_URNA[tipo]) {
    return resultado(STATUS_POR_TIPO_URNA[tipo], null, bu);
  }

  if (tipo === null || tipo === undefined || tipo < 1 || tipo > 5) {
    return resultado('desconhecido', 'TIPO_URNA_AUSENTE', bu);
  }

  if (bu.horario_impossivel) {
    return resultado('desconhecido', 'HORARIOS_INCONSISTENTES', bu);
  }

  if (corte.tipo === 'final') return resultado('bu_recebido', null, bu);

  if (corte.tipo === 'recebimento_intradiario') {
    const instante = corte.instante instanceof Date ? corte.instante : new Date(corte.instante);
    const precisao = bu.precisao_dt_bu_recebido ?? 'AUSENTE';

    if (precisao === 'DATA_HORA') {
      const recebido = bu.dt_bu_recebido_ts ? new Date(bu.dt_bu_recebido_ts) : null;
      if (recebido && recebido <= instante) return resultado('bu_recebido', null, bu);
      const encerramento = bu.dt_encerramento ? new Date(bu.dt_encerramento) : null;
      const emissao = bu.dt_emissao_bu ? new Date(bu.dt_emissao_bu) : null;
      if ((encerramento && encerramento <= instante) || (emissao && emissao <= instante)) {
        return resultado('encerrada_aguardando_bu', null, bu);
      }
      return resultado('sem_bu', null, bu);
    }

    return resultado('desconhecido', 'PRECISAO_INSUFICIENTE', bu);
  }

  if (corte.tipo === 'recebimento_diario') {
    const dia = corte.data;
    const precisao = bu.precisao_dt_bu_recebido ?? 'AUSENTE';

    if (precisao === 'DATA_HORA' && diaEmSaoPaulo(bu.dt_bu_recebido_ts) <= dia) {
      return resultado('bu_recebido', null, bu);
    }
    if (precisao === 'DATA' && bu.dt_bu_recebido_data && bu.dt_bu_recebido_data <= dia) {
      return resultado('bu_recebido', null, bu);
    }

    const encerramento = diaEmSaoPaulo(bu.dt_encerramento);
    const emissao = diaEmSaoPaulo(bu.dt_emissao_bu);
    if ((encerramento && encerramento <= dia) || (emissao && emissao <= dia)) {
      return resultado('encerrada_aguardando_bu', null, bu);
    }

    if (precisao === 'AUSENTE') return resultado('desconhecido', 'PRECISAO_INSUFICIENTE', bu);
    return resultado('sem_bu', null, bu);
  }

  return resultado('desconhecido', 'CORTE_INVALIDO', bu);
}
