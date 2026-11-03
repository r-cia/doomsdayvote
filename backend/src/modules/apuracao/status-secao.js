function iso(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

export function horariosDoBu(bu) {
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
