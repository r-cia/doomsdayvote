import { CAMPOS_2014_31 } from './campos.js';
import { parsearRegistro } from './parser-45.js';

function alertar(registro, campo, mensagem) {
  registro.erros.push({
    codigo: 'METADADO_DERIVADO_DIVERGENTE',
    campo,
    mensagem,
  });
}

export function parsearRegistro2014(campos, nrLinha, derivados) {
  const registro = parsearRegistro(campos, CAMPOS_2014_31, nrLinha);

  registro.valores.ANO_ELEICAO = derivados.ano;
  delete registro.ausencias.ANO_ELEICAO;
  registro.valores.NR_TURNO = derivados.turno;
  delete registro.ausencias.NR_TURNO;

  if (registro.valores.SG_UF && registro.valores.SG_UF !== derivados.uf) {
    alertar(registro, 'SG_UF', `UF do nome (${derivados.uf}) difere da linha (${registro.valores.SG_UF})`);
  }

  const geracao = registro.valores.DT_GERACAO;
  if (geracao?.precisao === 'DATA_HORA' && geracao.local !== derivados.geracao) {
    alertar(registro, 'DT_GERACAO', `Geração do nome (${derivados.geracao}) difere da linha (${geracao.local})`);
  }

  const recebido = registro.valores.DT_BU_RECEBIDO;
  if (recebido?.precisao === 'DATA' && recebido.data.slice(0, 4) !== String(derivados.ano)) {
    alertar(registro, 'DT_BU_RECEBIDO', `Ano derivado (${derivados.ano}) difere do recebimento (${recebido.data})`);
  }

  return registro;
}
