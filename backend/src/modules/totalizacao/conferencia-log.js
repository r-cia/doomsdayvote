import { TIPO_EVENTO } from './log.js';

const FORMATO_INSTANTE_BU = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/;

function instanteBu(valor) {
  const achado = FORMATO_INSTANTE_BU.exec(valor);
  if (!achado) throw new Error(`data/hora do BU fora do formato: ${valor}`);
  const [, ano, mes, dia, hora, minuto, segundo] = achado;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function contar(eventos, tipo) {
  return eventos.filter((evento) => evento.tipo === tipo).length;
}

function primeiroInstante(eventos, tipo) {
  return eventos.find((evento) => evento.tipo === tipo)?.instante ?? 'ausente';
}

export function conferirBuLog({ bu, eventos, sgUf, cdMunicipioTse, nrZona, nrSecao }) {
  const comparacoes = [
    {
      campo: 'comparecimento',
      valor_esperado: String(bu.comparecimento),
      valor_encontrado: String(contar(eventos, TIPO_EVENTO.VOTO_COMPUTADO)),
    },
    {
      campo: 'biometria',
      valor_esperado: String(bu.habilitacao2),
      valor_encontrado: String(contar(eventos, TIPO_EVENTO.HABILITACAO_BIOMETRICA)),
    },
    {
      campo: 'abertura',
      valor_esperado: instanteBu(bu.abertura),
      valor_encontrado: primeiroInstante(eventos, TIPO_EVENTO.URNA_PRONTA),
    },
    {
      campo: 'encerramento',
      valor_esperado: instanteBu(bu.encerramento),
      valor_encontrado: primeiroInstante(eventos, TIPO_EVENTO.ENCERRAMENTO),
    },
  ];

  return comparacoes
    .filter((comparacao) => comparacao.valor_esperado !== comparacao.valor_encontrado)
    .map((comparacao) => ({
      fonte: 'log',
      campo: comparacao.campo,
      sg_uf: sgUf,
      cd_municipio_tse: cdMunicipioTse,
      nr_zona: nrZona,
      nr_secao: nrSecao,
      valor_esperado: comparacao.valor_esperado,
      valor_encontrado: comparacao.valor_encontrado,
    }));
}
