import { TIPOS } from './bweb/campos.js';

export const CHAVE_NATURAL = [
  'ANO_ELEICAO',
  'CD_PLEITO',
  'CD_ELEICAO',
  'NR_TURNO',
  'SG_UF',
  'CD_MUNICIPIO',
  'NR_ZONA',
  'NR_SECAO',
  'CD_CARGO_PERGUNTA',
  'CD_TIPO_VOTAVEL',
  'NR_VOTAVEL',
];

export const CARGOS_EM_ESCOPO = ['presidente', 'governador'];

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function cargoEmEscopo(dsCargo) {
  return CARGOS_EM_ESCOPO.includes(normalizar(dsCargo));
}

function chaveNatural(registro) {
  return CHAVE_NATURAL.map((campo) => registro.valores[campo] ?? '').join('|');
}

function chaveBu(registro) {
  const v = registro.valores;
  return [
    v.ANO_ELEICAO,
    v.CD_PLEITO,
    v.CD_ELEICAO,
    v.NR_TURNO,
    v.SG_UF,
    v.CD_MUNICIPIO,
    v.NR_ZONA,
    v.NR_SECAO,
    v.CD_CARGO_PERGUNTA,
  ].join('|');
}

function alerta(severidade, codigo, mensagem, { nrLinha = null, campo = null, contexto = {} } = {}) {
  return { severidade, codigo, mensagem, nrLinha, campo, contexto };
}

export function encodingSuspeito(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return true;
  }
  const texto = buffer.toString('utf8');
  if (!Buffer.from(texto, 'utf8').equals(buffer)) return false;
  return buffer.some((byte) => byte >= 0x80);
}

export function validarLinha(registro, { vistos = new Set() } = {}) {
  const alertas = [];
  let importar = true;
  const v = registro.valores;

  for (const erro of registro.erros ?? []) {
    if (erro.codigo === 'LARGURA_INVALIDA') {
      alertas.push(alerta('erro', 'LARGURA_INVALIDA', erro.mensagem, { nrLinha: registro.nrLinha }));
      importar = false;
    } else if (erro.codigo === 'TIPO_INVALIDO') {
      const critico = CHAVE_NATURAL.includes(erro.campo) || erro.campo === 'QT_VOTOS';
      alertas.push(alerta(critico ? 'erro' : 'alerta', 'TIPO_INVALIDO', erro.mensagem, { nrLinha: registro.nrLinha, campo: erro.campo }));
      if (critico) importar = false;
    } else if (erro.codigo === 'FORMATO_DATA_INVALIDO') {
      alertas.push(alerta('alerta', 'FORMATO_DATA_INVALIDO', erro.mensagem, { nrLinha: registro.nrLinha, campo: erro.campo }));
    } else if (erro.codigo === 'METADADO_DERIVADO_DIVERGENTE') {
      alertas.push(alerta('alerta', 'METADADO_DERIVADO_DIVERGENTE', erro.mensagem, { nrLinha: registro.nrLinha, campo: erro.campo }));
    } else {
      alertas.push(alerta('alerta', erro.codigo, erro.mensagem, { nrLinha: registro.nrLinha, campo: erro.campo }));
    }
  }

  const faltando = CHAVE_NATURAL.filter((campo) => v[campo] === null || v[campo] === undefined);
  if (faltando.length > 0) {
    alertas.push(alerta('erro', 'CHAVE_INCOMPLETA', `Chave incompleta: ${faltando.join(', ')}`, { nrLinha: registro.nrLinha }));
    importar = false;
  }

  for (const [campo, tipo] of Object.entries(TIPOS)) {
    if (tipo === 'inteiro' && typeof v[campo] === 'number' && v[campo] < 0) {
      alertas.push(alerta('alerta', 'VALOR_NEGATIVO_INESPERADO', `${campo} = ${v[campo]}`, { nrLinha: registro.nrLinha, campo }));
    }
  }

  if (importar) {
    const chave = chaveNatural(registro);
    if (vistos.has(chave)) {
      alertas.push(alerta('erro', 'CHAVE_DUPLICADA', `Chave repetida: ${chave}`, { nrLinha: registro.nrLinha }));
      importar = false;
    } else {
      vistos.add(chave);
    }
  }

  return { importar, alertas };
}

function validarMetadadosIncremental(registros, estado) {
  const alertas = [];

  for (const registro of registros) {
    const v = registro.valores;
    const chave = v.CD_ELEICAO;
    const atual = {
      ANO_ELEICAO: v.ANO_ELEICAO,
      NR_TURNO: v.NR_TURNO,
      DT_PLEITO: v.DT_PLEITO?.data ?? null,
      SG_UF: v.SG_UF,
    };
    const anterior = estado.porEleicao.get(chave);
    if (!anterior) {
      estado.porEleicao.set(chave, atual);
      continue;
    }
    if (estado.divergentes.has(chave)) continue;
    if (JSON.stringify(anterior) !== JSON.stringify(atual)) {
      alertas.push(alerta('alerta', 'METADADO_INCONSISTENTE', `Metadados divergentes para CD_ELEICAO ${chave}`, { nrLinha: registro.nrLinha }));
      estado.divergentes.add(chave);
    }
  }

  return alertas;
}

function validarBu(registros, leiaute) {
  const alertas = [];
  const grupos = new Map();

  for (const registro of registros) {
    const chave = chaveBu(registro);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(registro);
  }

  for (const registrosBu of grupos.values()) {
    const primeiro = registrosBu[0];
    const v = primeiro.valores;

    for (const metrica of ['QT_APTOS', 'QT_COMPARECIMENTO', 'QT_ABSTENCOES']) {
      const valores = registrosBu.map((r) => r.valores[metrica]).filter((valor) => valor !== null && valor !== undefined);
      if (new Set(valores).size > 1) {
        alertas.push(alerta('alerta', 'METRICA_SECAO_DIVERGENTE', `${metrica} divergente no mesmo BU`, { nrLinha: primeiro.nrLinha, campo: metrica }));
        for (const r of registrosBu) r.valores[metrica] = null;
      }
    }

    const abertura = v.DT_ABERTURA?.local ?? null;
    const encerramento = v.DT_ENCERRAMENTO?.local ?? null;
    const emissao = v.DT_EMISSAO_BU?.local ?? null;
    const recebido = v.DT_BU_RECEBIDO?.precisao === 'DATA_HORA' ? v.DT_BU_RECEBIDO.local : null;

    if (abertura && emissao && emissao < abertura) {
      alertas.push(alerta('alerta', 'HORARIO_IMPOSSIVEL', 'Emissão anterior à abertura', { nrLinha: primeiro.nrLinha }));
    }
    if (abertura && encerramento && encerramento < abertura) {
      alertas.push(alerta('alerta', 'HORARIO_IMPOSSIVEL', 'Encerramento anterior à abertura', { nrLinha: primeiro.nrLinha }));
    }
    if (emissao && recebido && recebido < emissao) {
      alertas.push(alerta('alerta', 'HORARIO_IMPOSSIVEL', 'Recebimento anterior à emissão', { nrLinha: primeiro.nrLinha }));
    }

    if (leiaute !== 'BWEB_2018_42' && leiaute !== 'BWEB_2014_31') {
      if (!v.DT_ENCERRAMENTO || v.DT_ENCERRAMENTO.precisao === 'AUSENTE') {
        alertas.push(alerta('alerta', 'CAMPO_AUSENTE', 'DT_ENCERRAMENTO ausente', { nrLinha: primeiro.nrLinha, campo: 'DT_ENCERRAMENTO' }));
      }
    }

    if (leiaute !== 'BWEB_2018_42') {
      if (!v.DT_BU_RECEBIDO || v.DT_BU_RECEBIDO.precisao === 'AUSENTE') {
        alertas.push(alerta('alerta', 'CAMPO_AUSENTE', 'DT_BU_RECEBIDO ausente', { nrLinha: primeiro.nrLinha, campo: 'DT_BU_RECEBIDO' }));
      }
    }

    if (cargoEmEscopo(v.DS_CARGO_PERGUNTA) && v.QT_COMPARECIMENTO !== null) {
      const soma = registrosBu.reduce((total, r) => total + (r.valores.QT_VOTOS ?? 0), 0);
      if (soma !== v.QT_COMPARECIMENTO) {
        alertas.push(alerta('alerta', 'SOMA_VOTOS_DIVERGENTE', `Soma de QT_VOTOS (${soma}) difere do comparecimento (${v.QT_COMPARECIMENTO})`, { nrLinha: primeiro.nrLinha }));
      }
    }
  }

  return alertas;
}

export function criarValidador({ leiaute } = {}) {
  const estado = { porEleicao: new Map(), divergentes: new Set() };

  return {
    validarGrupo(registros) {
      const alertas = [];
      const vistos = new Set();
      const validos = [];

      for (const registro of registros) {
        const resultado = validarLinha(registro, { vistos });
        alertas.push(...resultado.alertas);
        if (resultado.importar) validos.push(registro);
      }

      alertas.push(...validarMetadadosIncremental(validos, estado));
      alertas.push(...validarBu(validos, leiaute));

      return { registros: validos, alertas };
    },
  };
}

export function validarRegistros(registros, { leiaute, buffer } = {}) {
  const validador = criarValidador({ leiaute });
  const { registros: validos, alertas } = validador.validarGrupo(registros);

  if (buffer && encodingSuspeito(buffer)) {
    alertas.push(alerta('alerta', 'ENCODING_SUSPEITO', 'Arquivo parece UTF-8 ou tem BOM; esperado Latin-1'));
  }

  return { registros: validos, alertas };
}
