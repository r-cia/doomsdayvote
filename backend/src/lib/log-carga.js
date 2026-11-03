const CAMPOS = [
  'arquivo',
  'uf',
  'ano',
  'turno',
  'lote_id',
  'duracao_ms',
  'linhas',
  'linhas_importadas',
  'erros',
  'alertas',
  'secoes',
  'secao',
  'prefixo',
  'secoes_com_erro',
  'secoes_ignoradas',
  'votos_bu',
  'votos_rdv',
  'arquivos',
  'importados',
  'ignorados',
  'parciais',
  'falhas',
  'motivo',
  'status',
  'erro_codigo',
  'erro_mensagem',
];

export function linhaDeEvento(evento, contexto = {}, instante = new Date()) {
  const linha = { evento, instante: instante.toISOString() };
  for (const campo of CAMPOS) {
    const valor = contexto[campo];
    if (valor !== undefined && valor !== null) linha[campo] = valor;
  }
  return linha;
}

export function registrarEventoCarga(evento, contexto = {}, escrever = console.log) {
  const linha = linhaDeEvento(evento, contexto);
  escrever(JSON.stringify(linha));
  return linha;
}
