const URL_BASE = 'https://dadosabertos.tse.jus.br';

const DATASETS = {
  bu: {
    2026: 'resultados-2026-arquivos-transmitidos-para-totalizacao',
    2022: 'resultados-2022-arquivos-transmitidos-para-totalizacao',
  },
  bweb: {
    2026: 'resultados-2026-boletim-de-urna',
    2022: 'resultados-2022-boletim-de-urna',
    2018: 'resultados-2018-boletim-de-urna',
    2014: 'resultados-2014-boletim-de-urna',
  },
  result: {
    2010: 'resultados-2010',
    2006: 'resultados-2006',
    2002: 'resultados-2002',
    1998: 'resultados-1998',
    1994: 'resultados-1994',
    1990: 'resultados-1990',
    1989: 'resultados-1989',
  },
};

const ARQUIVOS_RESULT = {
  1989: ['votacao_candidato_uf', 'detalhe_votacao_uf'],
  1990: ['votacao_candidato_uf', 'detalhe_votacao_uf', 'votacao_partido_uf'],
  1994: ['votacao_candidato_munzona', 'detalhe_votacao_munzona'],
  1998: ['votacao_secao', 'detalhe_votacao_secao', 'votacao_candidato_munzona'],
  2002: ['votacao_secao', 'detalhe_votacao_secao', 'votacao_candidato_munzona'],
  2006: ['votacao_secao', 'detalhe_votacao_secao', 'votacao_candidato_munzona'],
  2010: ['votacao_secao', 'detalhe_votacao_secao', 'votacao_candidato_munzona'],
};

const PADRAO_ASSINATURA = /\.(sha512|sha256|sha1|md5)$/i;
const PADROES_NOME = {
  bu: /_(\d)t_([A-Z]{2})\.(?:zip|7z)$/i,
  bweb: /bweb_(\d)t_([A-Z]{2})_/i,
  result: /_\d{4}_([A-Z]{2})\.zip$/i,
};

function identificar(tipo, url) {
  const achado = PADROES_NOME[tipo].exec(url);
  if (!achado) return { uf: null, turno: null };
  if (tipo === 'result') return { uf: achado[1].toUpperCase(), turno: null };
  return { uf: achado[2].toUpperCase(), turno: Number(achado[1]) };
}

function recursoDoEscopo(tipo, ano, url) {
  if (tipo !== 'result') return true;
  const nome = url.split('/').pop();
  return ARQUIVOS_RESULT[ano].some((prefixo) => nome.startsWith(`${prefixo}_`));
}

export function anosDisponiveis(tipo) {
  const anos = Object.keys(DATASETS[tipo] ?? {}).map(Number);
  if (anos.length === 0) throw new Error(`tipo de aquisição desconhecido: ${tipo}`);
  return anos.sort((a, b) => b - a);
}

export function datasetDoAno(tipo, ano) {
  const slug = DATASETS[tipo]?.[ano];
  if (!slug) {
    throw new Error(`${tipo} não possui dataset para ${ano}: anos disponíveis ${anosDisponiveis(tipo).join(', ')}`);
  }
  return slug;
}

export async function listarRecursos(tipo, ano, { urlBase = URL_BASE, fetch: buscar = fetch } = {}) {
  const slug = datasetDoAno(tipo, ano);
  const resposta = await buscar(`${urlBase}/api/3/action/package_show?id=${slug}`);
  if (!resposta.ok) throw new Error(`catálogo ${slug} respondeu ${resposta.status}`);
  const corpo = await resposta.json();
  if (!corpo?.success) throw new Error(`catálogo ${slug} sem resultado`);

  return (corpo.result.resources ?? [])
    .filter((recurso) => recurso.url && !PADRAO_ASSINATURA.test(recurso.url))
    .filter((recurso) => recursoDoEscopo(tipo, ano, recurso.url))
    .map((recurso) => ({
      nome: recurso.name,
      url: recurso.url,
      ...identificar(tipo, recurso.url),
    }));
}

export function filtrarRecursos(recursos, { ufs = [], turnos = [] } = {}) {
  const ufsNormalizadas = ufs.map((uf) => uf.toUpperCase());
  return recursos.filter((recurso) => {
    if (ufsNormalizadas.length > 0 && !ufsNormalizadas.includes(recurso.uf)) return false;
    if (turnos.length > 0 && !turnos.includes(recurso.turno)) return false;
    return true;
  });
}
