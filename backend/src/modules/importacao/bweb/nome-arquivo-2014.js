import { ErroLeiaute } from './detectar-leiaute.js';
import { normalizarDataHora, normalizarHora } from './normalizar.js';

const PADRAO = /^bweb_([12])t_([A-Z]{2})_(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})\.(txt|csv)$/i;

export function interpretarNomeArquivo2014(nome) {
  const encontrado = PADRAO.exec(nome ?? '');
  if (!encontrado) {
    throw new ErroLeiaute('NOME_ARQUIVO_2014_INVALIDO', `Nome fora do padrão: ${nome}`, {
      nomeArquivo: nome,
    });
  }

  const [, turno, uf, dia, mes, ano, hora, minuto, segundo] = encontrado;
  const data = normalizarDataHora(`${dia}/${mes}/${ano}`);
  const horaNormalizada = normalizarHora(`${hora}:${minuto}:${segundo}`);

  if (data.valor.precisao !== 'DATA' || !horaNormalizada.valor) {
    throw new ErroLeiaute('NOME_ARQUIVO_2014_INVALIDO', `Data/hora inválida no nome: ${nome}`, {
      nomeArquivo: nome,
    });
  }

  return {
    turno: Number(turno),
    uf: uf.toUpperCase(),
    geracao: `${ano}-${mes}-${dia} ${horaNormalizada.valor}`,
    ano: Number(ano),
  };
}
