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

export function janelaDoBu(eventos, bu) {
  const abertura = instanteBu(bu.abertura);
  const encerramento = instanteBu(bu.encerramento);
  const inicio = eventos.findIndex(
    (evento) => evento.tipo === TIPO_EVENTO.URNA_PRONTA && evento.instante === abertura,
  );
  const fim =
    inicio < 0
      ? -1
      : eventos.findIndex(
          (evento, indice) =>
            indice > inicio &&
            evento.tipo === TIPO_EVENTO.ENCERRAMENTO &&
            evento.instante === encerramento,
        );

  if (fim < 0) {
    return { eventos, identificada: false, abertura, encerramento, fora: 0, votosFora: 0 };
  }

  const dentro = eventos.slice(inicio, fim + 1);
  const fora = [...eventos.slice(0, inicio), ...eventos.slice(fim + 1)];
  const instantes = fora.map((evento) => evento.instante).sort();
  return {
    eventos: dentro,
    identificada: true,
    abertura,
    encerramento,
    fora: fora.length,
    votosFora: contar(fora, TIPO_EVENTO.VOTO_COMPUTADO),
    primeiroFora: instantes[0] ?? null,
    ultimoFora: instantes[instantes.length - 1] ?? null,
  };
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
