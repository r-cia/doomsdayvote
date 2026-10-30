import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';
import { agruparSecoes } from './comparacao-local.js';

function toNumberOrNull(valor) {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function mediana(valores) {
  const validos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (validos.length === 0) return null;
  const meio = Math.floor(validos.length / 2);
  if (validos.length % 2 === 1) return validos[meio];
  return (validos[meio - 1] + validos[meio]) / 2;
}

function media(valores) {
  const validos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (validos.length === 0) return null;
  return validos.reduce((soma, v) => soma + v, 0) / validos.length;
}

function desvioPadrao(valores) {
  const validos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (validos.length === 0) return null;
  const m = media(validos);
  const variancia = validos.reduce((soma, v) => soma + (v - m) ** 2, 0) / validos.length;
  return Math.sqrt(variancia);
}

function percentilRank(valores, valor) {
  const validos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (validos.length < 2 || typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  const menoresOuIguais = validos.filter((v) => v <= valor).length;
  return (menoresOuIguais / validos.length) * 100;
}

function normalizarSecao(secao) {
  const candidatosRaw =
    secao?.candidatos ?? secao?.candidates ?? secao?.votos ?? secao?.resultados ?? [];
  const candidatos = Array.isArray(candidatosRaw)
    ? candidatosRaw.map((c) => ({
        nr_votavel: c?.nr_votavel ?? c?.nrVotavel ?? c?.numero ?? null,
        nm_votavel: c?.nm_votavel ?? c?.nmVotavel ?? c?.nome ?? null,
        sg_partido: c?.sg_partido ?? c?.sgPartido ?? c?.partido ?? null,
        votos: toNumberOrNull(c?.qt_votos ?? c?.votos ?? c?.qtVotos),
      }))
    : [];

  return {
    id: secao?.id ?? secao?.secao_id ?? secao?.secaoId ?? null,
    sg_uf: secao?.sg_uf ?? secao?.uf ?? secao?.sgUf ?? null,
    cd_municipio_tse: secao?.cd_municipio_tse ?? secao?.municipio ?? secao?.cdMunicipioTse ?? null,
    nm_municipio: secao?.nm_municipio ?? secao?.nmMunicipio ?? null,
    nr_zona: secao?.nr_zona ?? secao?.zona ?? secao?.nrZona ?? null,
    nr_secao: secao?.nr_secao ?? secao?.secao ?? secao?.nrSecao ?? null,
    nr_local_votacao: secao?.nr_local_votacao ?? secao?.nrLocalVotacao ?? secao?.local_votacao ?? secao?.local ?? null,
    aptos: toNumberOrNull(secao?.qt_aptos ?? secao?.aptos ?? secao?.qtAptos),
    validos: toNumberOrNull(
      secao?.qt_votos_validos ?? secao?.votos_validos ?? secao?.validos ?? secao?.total_validos,
    ),
    candidatos,
  };
}

function metricasSecao(secao) {
  const candidatos = secao.candidatos
    .map((c) => ({
      nr_votavel: c.nr_votavel,
      nm_votavel: c.nm_votavel,
      sg_partido: c.sg_partido,
      votos: c.votos,
    }))
    .filter((c) => c.votos !== null);

  const validosCalculado = candidatos.reduce((soma, c) => soma + (c.votos ?? 0), 0);
  const validos =
    secao.validos !== null && secao.validos !== undefined
      ? secao.validos
      : validosCalculado > 0
        ? validosCalculado
        : null;

  const ordenados = [...candidatos].sort((a, b) => {
    const diff = (b.votos ?? 0) - (a.votos ?? 0);
    if (diff !== 0) return diff;
    return Number(a.nr_votavel ?? 0) - Number(b.nr_votavel ?? 0);
  });

  const lider = ordenados[0] ?? null;
  const segundo = ordenados[1] ?? null;

  const shareLider =
    validos !== null && validos > 0 && lider ? lider.votos / validos : null;
  const shareSegundo =
    validos !== null && validos > 0 && segundo ? segundo.votos / validos : null;
  const margemAbsoluta =
    lider && segundo ? lider.votos - segundo.votos : null;
  const margemPp =
    shareLider !== null && shareSegundo !== null
      ? (shareLider - shareSegundo) * 100
      : null;

  return {
    secao: {
      id: secao.id,
      sg_uf: secao.sg_uf,
      cd_municipio_tse: secao.cd_municipio_tse,
      nm_municipio: secao.nm_municipio,
      nr_zona: secao.nr_zona,
      nr_secao: secao.nr_secao,
      nr_local_votacao: secao.nr_local_votacao,
    },
    aptos: secao.aptos,
    validos,
    candidatos: candidatos.map((c) => ({
      nr_votavel: c.nr_votavel,
      nm_votavel: c.nm_votavel,
      sg_partido: c.sg_partido,
      votos: c.votos,
      share: validos && validos > 0 && c.votos !== null ? c.votos / validos : null,
    })),
    lider: lider
      ? {
          nr_votavel: lider.nr_votavel,
          nm_votavel: lider.nm_votavel,
          sg_partido: lider.sg_partido,
          votos: lider.votos,
          share: shareLider,
        }
      : null,
    segundo: segundo
      ? {
          nr_votavel: segundo.nr_votavel,
          nm_votavel: segundo.nm_votavel,
          sg_partido: segundo.sg_partido,
          votos: segundo.votos,
          share: shareSegundo,
        }
      : null,
    share_lider: shareLider,
    share_segundo: shareSegundo,
    margem_segundo: margemAbsoluta,
    margem_absoluta: margemAbsoluta,
    margem_pp: margemPp,
    margem_segundo_pp: margemPp,
  };
}

function enriquecerGrupo(lista, grupoInfo, origem, minimoGrupo) {
  const shares = lista.map((s) => s.share_lider).filter((v) => typeof v === 'number' && Number.isFinite(v));
  const margens = lista.map((s) => s.margem_absoluta).filter((v) => typeof v === 'number' && Number.isFinite(v));

  const mediaShare = media(shares);
  const desvioShare = desvioPadrao(shares);
  const mediaMargem = media(margens);
  const desvioMargem = desvioPadrao(margens);

  const ok = lista.length >= minimoGrupo && shares.length >= 2;

  return lista.map((s) => ({
    ...s,
    contexto: {
      origem,
      grupo: {
        nivel: grupoInfo?.nivel ?? null,
        chave: grupoInfo?.chave ?? null,
        tamanho: grupoInfo?.tamanho ?? lista.length,
      },
      share_lider_percentil: ok ? percentilRank(shares, s.share_lider) : null,
      share_lider_z:
        ok && desvioShare && desvioShare > 0
          ? (s.share_lider - mediaShare) / desvioShare
          : null,
      margem_percentil: ok ? percentilRank(margens, s.margem_absoluta) : null,
      margem_z:
        ok && desvioMargem && desvioMargem > 0
          ? (s.margem_absoluta - mediaMargem) / desvioMargem
          : null,
      media_share: mediaShare,
      desvio_share: desvioShare,
      media_margem: mediaMargem,
      desvio_margem: desvioMargem,
      estado: ok ? 'ok' : 'dados_insuficientes',
    },
    estado: ok ? 'ok' : 'dados_insuficientes',
  }));
}

export function agruparPorAptos(secoes = [], { bandas = 4, minimoGrupo = 5 } = {}) {
  return agruparPorFaixaAptos(secoes, { bandas, minimoGrupo });
}

export function agruparPorFaixaAptos(secoes = [], { bandas = 4, minimoGrupo = 5 } = {}) {
  const lista = (Array.isArray(secoes) ? secoes : []).map(normalizarSecao);
  const comAptos = lista.filter((s) => s.aptos !== null);
  const semAptos = lista.filter((s) => s.aptos === null);
  const resultado = [];

  if (comAptos.length === 0) {
    if (lista.length > 0) resultado.push(lista);
    return resultado;
  }

  const ordenados = [...comAptos].sort((a, b) => a.aptos - b.aptos);
  const n = ordenados.length;
  const grupos = Math.max(1, Math.min(bandas, Math.floor(n / Math.max(1, minimoGrupo)) || 1));
  const tamanhoBase = Math.floor(n / grupos);
  let inicio = 0;
  for (let i = 0; i < grupos; i += 1) {
    const fim = i === grupos - 1 ? n : inicio + tamanhoBase;
    resultado.push(ordenados.slice(inicio, fim));
    inicio = fim;
  }
  if (semAptos.length > 0) resultado.push(semAptos);
  return resultado;
}

function faixaChave(banda) {
  const aptos = banda.map((s) => s.aptos).filter((v) => v !== null);
  if (aptos.length === 0) return 'sem_aptos';
  return `aptos ${Math.min(...aptos)}-${Math.max(...aptos)}`;
}

export function calcularConcentracao(entrada, opcoes = {}) {
  return concentracaoPura(entrada, opcoes);
}

export function concentracaoPura(entrada, opcoes = {}) {
  let listaSecoes = [];
  let opts = opcoes || {};
  if (Array.isArray(entrada)) {
    listaSecoes = entrada;
  } else if (entrada && typeof entrada === 'object') {
    listaSecoes =
      entrada.secoes ?? entrada.sections ?? entrada.items ?? entrada.itens ?? [];
    opts = { ...entrada, ...opcoes };
  }

  const topN = Number(opts.top ?? opts.topN ?? opts.limite ?? opts.limit ?? opts.n ?? 20);
  const minimoGrupo = Number(opts.minimoGrupo ?? opts.minimo_grupo ?? 5);
  const bandas = Number(opts.bandas ?? opts.bands ?? 4);

  const normalizadas = (Array.isArray(listaSecoes) ? listaSecoes : []).map(normalizarSecao);
  const metricas = normalizadas.map(metricasSecao);

  const secoesParaGrupo = normalizadas.map((s) => ({
    id: s.id,
    sg_uf: s.sg_uf,
    cd_municipio_tse: s.cd_municipio_tse,
    nm_municipio: s.nm_municipio,
    nr_zona: s.nr_zona,
    nr_secao: s.nr_secao,
    nr_local_votacao: s.nr_local_votacao,
    qt_aptos: s.aptos,
    candidatos: s.candidatos.map((c) => ({
      nr_votavel: c.nr_votavel,
      nm_votavel: c.nm_votavel,
      sg_partido: c.sg_partido,
      qt_votos: c.votos,
    })),
  }));

  const gruposComp = agruparSecoes(secoesParaGrupo, { minimoGrupo });

  const grupoPorSecao = new Map();
  for (const grupo of gruposComp.grupos ?? []) {
    for (const item of grupo.secoes ?? []) {
      const id = item?.secao?.id ?? item?.id ?? null;
      if (id !== null) grupoPorSecao.set(id, grupo);
    }
  }

  const enriquecidosPorId = new Map();

  for (const grupo of gruposComp.grupos ?? []) {
    const ids = new Set((grupo.secoes ?? []).map((item) => item?.secao?.id ?? item?.id));
    const peers = metricas.filter((m) => ids.has(m.secao.id));
    if (peers.length === 0) continue;
    const enriched = enriquecerGrupo(
      peers,
      {
        nivel: grupo.nivel,
        chave: grupo.chave ?? null,
        tamanho: grupo.tamanho ?? peers.length,
      },
      'grupo_comparavel',
      minimoGrupo,
    );
    for (const e of enriched) enriquecidosPorId.set(e.secao.id, e);
  }

  const fallbackMetricas = metricas.filter((m) => !enriquecidosPorId.has(m.secao.id));
  let faixasUtilizadas = 0;
  if (fallbackMetricas.length > 0) {
    const fallbackNormalizadas = fallbackMetricas.map((m) =>
      normalizadas.find((n) => n.id === m.secao.id),
    );
    const bandasAgrupadas = agruparPorFaixaAptos(fallbackNormalizadas, { bandas, minimoGrupo });
    faixasUtilizadas = bandasAgrupadas.length;
    for (const banda of bandasAgrupadas) {
      const ids = new Set(banda.map((s) => s.id));
      const peers = metricas.filter((m) => ids.has(m.secao.id));
      if (peers.length === 0) continue;
      const enriched = enriquecerGrupo(
        peers,
        {
          nivel: 'faixa_aptos',
          chave: faixaChave(banda),
          tamanho: peers.length,
        },
        'faixa_aptos',
        minimoGrupo,
      );
      for (const e of enriched) enriquecidosPorId.set(e.secao.id, e);
    }
  }

  for (const m of metricas) {
    if (enriquecidosPorId.has(m.secao.id)) continue;
    enriquecidosPorId.set(m.secao.id, {
      ...m,
      contexto: {
        origem: null,
        grupo: null,
        share_lider_percentil: null,
        share_lider_z: null,
        margem_percentil: null,
        margem_z: null,
        media_share: null,
        desvio_share: null,
        media_margem: null,
        desvio_margem: null,
        estado: 'dados_insuficientes',
      },
      estado: 'dados_insuficientes',
    });
  }

  const secoesFinais = metricas.map((m) => enriquecidosPorId.get(m.secao.id));

  const topShare = [...secoesFinais]
    .filter((s) => s.share_lider !== null)
    .sort((a, b) => {
      const diff = (b.share_lider ?? 0) - (a.share_lider ?? 0);
      if (diff !== 0) return diff;
      return (b.margem_absoluta ?? 0) - (a.margem_absoluta ?? 0);
    })
    .slice(0, topN);

  const topMargem = [...secoesFinais]
    .filter((s) => s.margem_absoluta !== null)
    .sort((a, b) => (b.margem_absoluta ?? 0) - (a.margem_absoluta ?? 0))
    .slice(0, topN);

  const comContexto = secoesFinais.filter((s) => s.contexto?.estado === 'ok').length;

  const limitacoes = [
    'Concentração calculada a partir do BU ativo no corte selecionado.',
    'Votos válidos = nominal + legenda; ausência de campo não é tratada como zero.',
    'Contexto por grupo comparável (local, zona ou município) com controle de escala por aptos; fallback por faixa de aptos quando a amostra for insuficiente.',
    'Seções com menos de dois candidatos não possuem margem para o segundo colocado.',
    'A ferramenta não define limiares de alerta; os resultados são descritivos.',
  ];

  const resultado = {
    secoes: secoesFinais,
    grupos: gruposComp.grupos ?? [],
    top_share: topShare,
    top_margem: topMargem,
    top_por_share: topShare,
    top_por_margem: topMargem,
    top_share_desc: topShare,
    top_margem_desc: topMargem,
    cobertura: {
      consideradas: metricas.length,
      com_contexto: comContexto,
      sem_contexto: metricas.length - comContexto,
      grupos: gruposComp.grupos?.length ?? 0,
      grupos_insuficientes:
        (gruposComp.grupos ?? []).filter((g) => g.dados_insuficientes).length,
      faixas_aptos: faixasUtilizadas,
    },
    limitacoes,
    total: secoesFinais.length,
    top: topN,
    top_n: topN,
  };

  return resultado;
}

export async function concentracao(db, { eleicaoId, cargo, corte, escopo = {}, limite, top, topN, ...rest } = {}) {
  const corteEfetivo = corte ?? { tipo: 'final' };

  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corteEfetivo);
  qb = aplicarEscopo(qb, escopo ?? {});

  const linhas = await qb
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.secao_id as secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      sql`max(l.nm_municipio)`.as('nm_municipio'),
      sql`max(bv.qt_aptos)`.as('qt_aptos'),
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(rv.sg_partido)`.as('sg_partido'),
      'rv.categoria',
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'bv.secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'rv.nr_votavel',
      'rv.categoria',
    ])
    .execute();

  const porSecao = new Map();
  for (const linha of linhas) {
    if (!porSecao.has(linha.secao_id)) {
      porSecao.set(linha.secao_id, {
        id: linha.secao_id,
        sg_uf: linha.sg_uf,
        cd_municipio_tse: linha.cd_municipio_tse,
        nm_municipio: linha.nm_municipio,
        nr_zona: linha.nr_zona,
        nr_secao: linha.nr_secao,
        nr_local_votacao: linha.nr_local_votacao,
        aptos: toNumberOrNull(linha.qt_aptos),
        validos: 0,
        candidatos: [],
      });
    }
    const secao = porSecao.get(linha.secao_id);
    const votos = toNumberOrNull(linha.votos);
    if (votos === null) continue;
    if (linha.categoria === 'nominal' || linha.categoria === 'legenda') {
      secao.validos += votos;
    }
    if (linha.categoria === 'nominal') {
      secao.candidatos.push({
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        qt_votos: votos,
      });
    }
  }

  const secoes = [...porSecao.values()].map((s) => ({
    id: s.id,
    sg_uf: s.sg_uf,
    cd_municipio_tse: s.cd_municipio_tse,
    nm_municipio: s.nm_municipio,
    nr_zona: s.nr_zona,
    nr_secao: s.nr_secao,
    nr_local_votacao: s.nr_local_votacao,
    qt_aptos: s.aptos,
    qt_votos_validos: s.validos,
    candidatos: s.candidatos,
  }));

  const topNFinal = Number(limite ?? top ?? topN ?? 20);
  return concentracaoPura(secoes, { top: topNFinal, minimoGrupo: 5, ...rest });
}

// Aliases for pure helpers
export const concentracaoDasSecoes = concentracaoPura;
export const concentracaoPorSecao = concentracaoPura;
export const concentracaoSecoes = concentracaoPura;
export const analisarConcentracao = concentracaoPura;
export const agruparConcentracao = concentracaoPura;
export const concentracaoPorFaixaAptos = agruparPorFaixaAptos;
export const faixaAptos = agruparPorFaixaAptos;
export const bandasAptos = agruparPorFaixaAptos;
export const agruparPorAptosAlias = agruparPorAptos;

const defaultExport = concentracao;
defaultExport.calcularConcentracao = calcularConcentracao;
defaultExport.concentracaoPura = concentracaoPura;
defaultExport.agruparPorAptos = agruparPorAptos;
defaultExport.agruparPorFaixaAptos = agruparPorFaixaAptos;
export default defaultExport;