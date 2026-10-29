import { lerPrimeiraLinha } from './leitor.js';

export class ErroLeiaute extends Error {
  constructor(codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ErroLeiaute';
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export function detectarLeiauteDeCampos(campos) {
  if (!campos || campos.length === 0) {
    throw new ErroLeiaute('ARQUIVO_VAZIO', 'Arquivo sem linhas');
  }

  if (campos[0].trim() === 'DT_GERACAO') {
    if (campos.length === 45) return 'BWEB_45';
    if (campos.length === 42) return 'BWEB_2018_42';
    throw new ErroLeiaute('LEIAUTE_DESCONHECIDO', `Cabeçalho com ${campos.length} colunas`, {
      colunas: campos.length,
    });
  }

  if (campos.length === 31) return 'BWEB_2014_31';

  throw new ErroLeiaute('LEIAUTE_DESCONHECIDO', `Primeira linha não reconhecida (${campos.length} colunas)`, {
    colunas: campos.length,
  });
}

export async function detectarLeiaute(caminho) {
  const primeira = await lerPrimeiraLinha(caminho);
  if (!primeira) {
    throw new ErroLeiaute('ARQUIVO_VAZIO', 'Arquivo sem linhas');
  }
  return detectarLeiauteDeCampos(primeira.campos);
}
