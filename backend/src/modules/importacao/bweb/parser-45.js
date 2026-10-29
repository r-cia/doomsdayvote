import { ALIASES, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo } from './campos.js';
import { combinarGeracao, normalizarData, normalizarDataHora, normalizarHora, normalizarInteiro, normalizarTexto } from './normalizar.js';
import { ErroLeiaute } from './detectar-leiaute.js';

function normalizarCampo(tipo, bruto) {
  if (tipo === 'inteiro') return normalizarInteiro(bruto);
  if (tipo === 'data') return normalizarData(bruto);
  if (tipo === 'hora') return normalizarHora(bruto);
  if (tipo === 'data_hora') return normalizarDataHora(bruto);
  return normalizarTexto(bruto);
}

export function validarCabecalho(camposBrutos, camposLeiaute) {
  const aliasesAplicados = [];
  const mapeados = camposBrutos.map((bruto) => {
    const nome = bruto.trim();
    const destino = ALIASES[nome];
    if (destino) {
      aliasesAplicados.push({ de: nome, para: destino });
      return destino;
    }
    return nome;
  });

  const vistos = new Set();
  for (const nome of mapeados) {
    if (vistos.has(nome)) {
      throw new ErroLeiaute('MUDANCA_LEIAUTE', `Campo duplicado no cabeçalho: ${nome}`, {
        duplicado: nome,
      });
    }
    vistos.add(nome);
  }

  const faltando = camposLeiaute.filter((nome) => !vistos.has(nome));
  const sobrando = mapeados.filter((nome) => !camposLeiaute.includes(nome));

  if (faltando.length > 0 || sobrando.length > 0) {
    throw new ErroLeiaute('MUDANCA_LEIAUTE', 'Cabeçalho diferente do leiaute esperado', {
      faltando,
      sobrando,
    });
  }

  return {
    headerMap: mapeados,
    aliasesAplicados,
    camposAusentesNoLeiaute: CAMPOS_CANONICOS.filter((nome) => !camposLeiaute.includes(nome)),
  };
}

export function parsearRegistro(campos, headerMap, nrLinha) {
  const bruto = {};
  const valores = {};
  const ausencias = {};
  const erros = [];

  if (campos.length !== headerMap.length) {
    erros.push({
      codigo: 'LARGURA_INVALIDA',
      campo: null,
      mensagem: `Linha com ${campos.length} campos; esperado ${headerMap.length}`,
    });
  }

  for (let i = 0; i < headerMap.length; i += 1) {
    bruto[headerMap[i]] = campos[i] ?? '';
  }

  for (const nome of CAMPOS_CANONICOS) {
    if (!Object.prototype.hasOwnProperty.call(bruto, nome)) {
      valores[nome] = null;
      ausencias[nome] = 'INEXISTENTE_NO_LEIAUTE';
      continue;
    }

    const resultado = normalizarCampo(tipoDoCampo(nome), bruto[nome]);
    valores[nome] = resultado.valor;
    if (resultado.ausencia) ausencias[nome] = resultado.ausencia;
    if (resultado.erro) {
      erros.push({ ...resultado.erro, campo: nome });
    }
  }

  if (valores.DT_GERACAO?.precisao === 'DATA' && typeof valores.HH_GERACAO === 'string') {
    valores.DT_GERACAO = combinarGeracao(valores.DT_GERACAO, valores.HH_GERACAO);
  }

  return { nrLinha, bruto, valores, ausencias, erros };
}

export function validarCabecalho45(camposBrutos) {
  return validarCabecalho(camposBrutos, CAMPOS_45);
}

export function parsearRegistro45(campos, headerMap, nrLinha) {
  return parsearRegistro(campos, headerMap, nrLinha);
}

const CARGOS_LEGISLATIVOS = new Set(['senador', 'deputado federal', 'deputado estadual']);

export function ehCargoLegislativoIgnorado(valor) {
  return CARGOS_LEGISLATIVOS.has(
    String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim(),
  );
}
