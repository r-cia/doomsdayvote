const MARCADORES = new Map([
  ['#NULO#', 'NULO'],
  ['#NULO', 'NULO'],
  ['#NE', 'NE'],
  ['', 'NULO'],
]);

function marcador(bruto) {
  return MARCADORES.get(bruto.trim());
}

function dataValida(ano, mes, dia) {
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
  const dias = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia <= dias[mes - 1];
}

function horaValida(hora, minuto, segundo) {
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59 && segundo >= 0 && segundo <= 59;
}

function doisDigitos(valor) {
  return String(valor).padStart(2, '0');
}

const DATA_HORA_BR = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
const DATA_HORA_ISO = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;
const DATA_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA = /^(\d{2}):(\d{2}):(\d{2})$/;

export function normalizarTexto(bruto) {
  const texto = (bruto ?? '').trim();
  const ausencia = marcador(texto);
  if (ausencia) return { valor: null, ausencia };
  return { valor: texto, ausencia: null };
}

export function normalizarInteiro(bruto) {
  const texto = (bruto ?? '').trim();
  const ausencia = marcador(texto);
  if (ausencia) return { valor: null, ausencia, erro: null };

  if (!/^-?\d+$/.test(texto)) {
    return {
      valor: null,
      ausencia: null,
      erro: { codigo: 'TIPO_INVALIDO', mensagem: `Valor inteiro inválido: ${texto}` },
    };
  }

  if (texto === '-1') return { valor: null, ausencia: 'NULO', erro: null };
  if (texto === '-3') return { valor: null, ausencia: 'NE', erro: null };

  return { valor: Number(texto), ausencia: null, erro: null };
}

export function normalizarDataHora(bruto) {
  const texto = (bruto ?? '').trim();
  const ausencia = marcador(texto);
  if (ausencia) {
    return { valor: { precisao: 'AUSENTE', local: null, data: null }, ausencia: null, erro: null };
  }

  const br = DATA_HORA_BR.exec(texto);
  if (br) {
    const [, dia, mes, ano, hora, minuto, segundo] = br;
    if (!dataValida(Number(ano), Number(mes), Number(dia)) || !horaValida(Number(hora), Number(minuto), Number(segundo))) {
      return { valor: { precisao: 'AUSENTE', local: null, data: null }, ausencia: null, erro: { codigo: 'FORMATO_DATA_INVALIDO', mensagem: `Data inválida: ${texto}` } };
    }
    const data = `${ano}-${mes}-${dia}`;
    return {
      valor: { precisao: 'DATA_HORA', local: `${data} ${hora}:${minuto}:${segundo}`, data: null },
      ausencia: null,
      erro: null,
    };
  }

  const iso = DATA_HORA_ISO.exec(texto);
  if (iso) {
    const [, ano, mes, dia, hora, minuto, segundo] = iso;
    if (!dataValida(Number(ano), Number(mes), Number(dia)) || !horaValida(Number(hora), Number(minuto), Number(segundo))) {
      return { valor: { precisao: 'AUSENTE', local: null, data: null }, ausencia: null, erro: { codigo: 'FORMATO_DATA_INVALIDO', mensagem: `Data inválida: ${texto}` } };
    }
    const data = `${ano}-${mes}-${dia}`;
    return {
      valor: { precisao: 'DATA_HORA', local: `${data} ${hora}:${minuto}:${segundo}`, data: null },
      ausencia: null,
      erro: null,
    };
  }

  const dataBr = DATA_BR.exec(texto);
  if (dataBr) {
    const [, dia, mes, ano] = dataBr;
    if (!dataValida(Number(ano), Number(mes), Number(dia))) {
      return { valor: { precisao: 'AUSENTE', local: null, data: null }, ausencia: null, erro: { codigo: 'FORMATO_DATA_INVALIDO', mensagem: `Data inválida: ${texto}` } };
    }
    return {
      valor: { precisao: 'DATA', local: null, data: `${ano}-${mes}-${dia}` },
      ausencia: null,
      erro: null,
    };
  }

  const dataIso = DATA_ISO.exec(texto);
  if (dataIso) {
    const [, ano, mes, dia] = dataIso;
    if (!dataValida(Number(ano), Number(mes), Number(dia))) {
      return { valor: { precisao: 'AUSENTE', local: null, data: null }, ausencia: null, erro: { codigo: 'FORMATO_DATA_INVALIDO', mensagem: `Data inválida: ${texto}` } };
    }
    return {
      valor: { precisao: 'DATA', local: null, data: `${ano}-${mes}-${dia}` },
      ausencia: null,
      erro: null,
    };
  }

  return {
    valor: { precisao: 'AUSENTE', local: null, data: null },
    ausencia: null,
    erro: { codigo: 'FORMATO_DATA_INVALIDO', mensagem: `Formato de data inválido: ${texto}` },
  };
}

export function normalizarData(bruto) {
  const resultado = normalizarDataHora(bruto);
  if (resultado.valor.precisao === 'DATA_HORA') {
    return {
      valor: { precisao: 'DATA', local: null, data: resultado.valor.local.slice(0, 10) },
      ausencia: resultado.ausencia,
      erro: null,
    };
  }
  return resultado;
}

export function normalizarHora(bruto) {
  const texto = (bruto ?? '').trim();
  const ausencia = marcador(texto);
  if (ausencia) return { valor: null, ausencia, erro: null };

  const encontrado = HORA.exec(texto);
  if (!encontrado) {
    return {
      valor: null,
      ausencia: null,
      erro: { codigo: 'FORMATO_HORA_INVALIDO', mensagem: `Hora inválida: ${texto}` },
    };
  }

  const [, hora, minuto, segundo] = encontrado;
  if (!horaValida(Number(hora), Number(minuto), Number(segundo))) {
    return {
      valor: null,
      ausencia: null,
      erro: { codigo: 'FORMATO_HORA_INVALIDO', mensagem: `Hora inválida: ${texto}` },
    };
  }

  return { valor: `${doisDigitos(hora)}:${doisDigitos(minuto)}:${doisDigitos(segundo)}`, ausencia: null, erro: null };
}

export function combinarGeracao(dataBweb, hora) {
  if (dataBweb?.precisao !== 'DATA' || !dataBweb.data || !hora) {
    return { precisao: 'AUSENTE', local: null, data: null };
  }
  return { precisao: 'DATA_HORA', local: `${dataBweb.data} ${hora}`, data: null };
}
