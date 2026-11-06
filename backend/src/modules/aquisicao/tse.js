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
    2010: 'resultados-2010',
    2006: 'resultados-2006',
    2002: 'resultados-2002',
    1998: 'resultados-1998',
    1994: 'resultados-1994',
  },
};

const PADRAO_ASSINATURA = /\.(sha512|sha256|md5)$/i;
const PADROES_NOME = {
  bu: /_(\d)t_([A-Z]{2})\.(?:zip|7z)$/i,
  bweb: /bweb_(\d)t_([A-Z]{2})_/i,
};

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
    .map((recurso) => {
      const achado = PADROES_NOME[tipo].exec(recurso.url);
      return {
        nome: recurso.name,
        url: recurso.url,
        uf: achado ? achado[2].toUpperCase() : null,
        turno: achado ? Number(achado[1]) : null,
      };
    });
}

export function filtrarRecursos(recursos, { ufs = [], turnos = [] } = {}) {
  const ufsNormalizadas = ufs.map((uf) => uf.toUpperCase());
  return recursos.filter((recurso) => {
    if (ufsNormalizadas.length > 0 && !ufsNormalizadas.includes(recurso.uf)) return false;
    if (turnos.length > 0 && !turnos.includes(recurso.turno)) return false;
    return true;
  });
}
