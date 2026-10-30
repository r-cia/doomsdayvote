import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';

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

function percentilRank(valores, valor) {
  const validos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (validos.length < 2 || typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  const menoresOuIguais = validos.filter((v) => v <= valor).length;
  return (menoresOuIguais / validos.length) * 100;
}

function aplicarEscala(secoes) {
  const aptos = secoes.map((s) => s.aptos).filter((v) => typeof v === 'number' && Number.isFinite(v));
  const med = mediana(aptos);
  if (med === null) return [...secoes];
  const minimo = med * 0.5;
  const maximo = med * 1.5;
  return secoes.filter((s) => s.aptos === null || (s.aptos >= minimo && s.aptos <= maximo));
}

function normalizarSecao(secao) {
  const candidatosRaw =
    secao.candidatos ?? secao.candidates ?? secao.votos ?? secao.resultados ?? secao.votos_por_candidato ?? [];
  const candidatos = Array.isArray(candidatosRaw)
    ? candidatosRaw.map((c) => ({
        nr_votavel: c.nr_votavel ?? c.nrVotavel ?? c.numero ?? null,
        nm_votavel: c.nm_votavel ?? c.nmVotavel ?? c.nome ?? null,
        sg_partido: c.sg_partido ?? c.sgPartido ?? c.partido ?? null,
        votos: toNumberOrNull(c.qt_votos ?? c.votos ?? c.qtVotos),
      }))
    : [];

  return {
    id: secao.id ?? secao.secao_id ?? secao.secaoId ?? null,
    sg_uf: secao.sg_uf ?? secao.uf ?? secao.sgUf ?? null,
    cd_municipio_tse: secao.cd_municipio_tse ?? secao.municipio ?? secao.cdMunicipioTse ?? null,
    nm_municipio: secao.nm_municipio ?? secao.nmMunicipio ?? null,
    nr_zona: secao.nr_zona ?? secao.zona ?? secao.nrZona ?? null,
    nr_secao: secao.nr_secao ?? secao.secao ?? secao.nrSecao ?? null,
    nr_local_votacao: secao.nr_local_votacao ?? secao.nrLocalVotacao ?? secao.local_votacao ?? secao.local ?? null,
    aptos: toNumberOrNull(secao.qt_aptos ?? secao.aptos ?? secao.qtAptos),
    comparecimento: toNumberOrNull(secao.qt_comparecimento ?? secao.comparecimento ?? secao.qtComparecimento),
    abstencoes: toNumberOrNull(secao.qt_abstencoes ?? secao.abstencoes ?? secao.qtAbstencoes),
    candidatos,
  };
}

function chaveLocal(s) {
  if (s.nr_local_votacao === null || s.nr_local_votacao === undefined) {
    return `zona:${s.sg_uf}|${s.cd_municipio_tse}|${s.nr_zona}`;
  }
  return `local:${s.sg_uf}|${s.cd_municipio_tse}|${s.nr_local_votacao}`;
}

function chaveZona(s) {
  return `zona:${s.sg_uf}|${s.cd_municipio_tse}|${s.nr_zona}`;
}

function chaveMunicipio(s) {
  return `municipio:${s.sg_uf}|${s.cd_municipio_tse}`;
}

function agruparPor(secoes, chaveFn) {
  const mapa = new Map();
  for (const secao of secoes) {
    const chave = chaveFn(secao);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(secao);
  }
  return mapa;
}

function shareCandidato(secao, nrVotavel) {
  const total = secao.candidatos.reduce((soma, c) => soma + (c.votos ?? 0), 0);
  if (total <= 0) return null;
  const candidato = secao.candidatos.find((c) => Number(c.nr_votavel) === Number(nrVotavel));
  if (!candidato || candidato.votos === null) return null;
  return candidato.votos / total;
}

function criarGrupo(secoes, nivel, chave, minimoGrupo) {
  const aptosArr = secoes.map((s) => s.aptos);
  const participacoes = secoes.map((s) =>
    s.aptos && s.aptos > 0 && s.comparecimento !== null ? s.comparecimento / s.aptos : null,
  );
  const abstencoesArr = secoes.map((s) =>
    s.aptos && s.aptos > 0 && s.abstencoes !== null ? s.abstencoes / s.aptos : null,
  );

  const medianaAptos = mediana(aptosArr.filter((v) => v !== null));
  const medianaParticipacao = mediana(participacoes);
  const medianaAbstencao = mediana(abstencoesArr);

  const aptosValidos = aptosArr.filter((v) => v !== null);
  const minAptos = aptosValidos.length ? Math.min(...aptosValidos) : null;
  const maxAptos = aptosValidos.length ? Math.max(...aptosValidos) : null;

  const candidatosUnicos = [
    ...new Map(
      secoes.flatMap((s) => s.candidatos).map((c) => [String(c.nr_votavel), c]),
    ).values(),
  ];

  const metricasCandidatos = candidatosUnicos.map((c) => {
    const shares = secoes.map((s) => shareCandidato(s, c.nr_votavel)).filter((v) => v !== null);
    return {
      nr_votavel: c.nr_votavel,
      nm_votavel: c.nm_votavel,
      sg_partido: c.sg_partido,
      share_mediana: mediana(shares),
      mediana_share: mediana(shares),
      share_media: media(shares),
      media_share: media(shares),
      n: shares.length,
    };
  });

  const secoesMetricas = secoes.map((s) => {
    const totalVotos = s.candidatos.reduce((soma, c) => soma + (c.votos ?? 0), 0);
    const candidatos = s.candidatos.map((c) => ({
      nr_votavel: c.nr_votavel,
      nm_votavel: c.nm_votavel,
      sg_partido: c.sg_partido,
      votos: c.votos,
      share: totalVotos > 0 && c.votos !== null ? c.votos / totalVotos : null,
    }));

    const participacao = s.aptos && s.aptos > 0 && s.comparecimento !== null ? s.comparecimento / s.aptos : null;
    const abstencao = s.aptos && s.aptos > 0 && s.abstencoes !== null ? s.abstencoes / s.aptos : null;

    const distanciaParticipacao =
      participacao !== null && medianaParticipacao !== null ? (participacao - medianaParticipacao) * 100 : null;
    const distanciaAbstencao =
      abstencao !== null && medianaAbstencao !== null ? (abstencao - medianaAbstencao) * 100 : null;

    const distanciaCandidatos = candidatos.map((c) => {
      const grupo = metricasCandidatos.find((g) => Number(g.nr_votavel) === Number(c.nr_votavel));
      const medianaShare = grupo?.share_mediana ?? null;
      const pp = c.share !== null && medianaShare !== null ? (c.share - medianaShare) * 100 : null;
      return { nr_votavel: c.nr_votavel, share_pp: pp, pp };
    });

    const percentilParticipacao = percentilRank(participacoes, participacao);
    const percentilAbstencao = percentilRank(abstencoesArr, abstencao);
    const percentilCandidatos = candidatos.map((c) => {
      const shares = secoes.map((sec) => shareCandidato(sec, c.nr_votavel)).filter((v) => v !== null);
      return {
        nr_votavel: c.nr_votavel,
        share_percentil: percentilRank(shares, c.share),
        percentil: percentilRank(shares, c.share),
      };
    });

    return {
      secao: {
        id: s.id,
        sg_uf: s.sg_uf,
        cd_municipio_tse: s.cd_municipio_tse,
        nm_municipio: s.nm_municipio,
        nr_zona: s.nr_zona,
        nr_secao: s.nr_secao,
        nr_local_votacao: s.nr_local_votacao,
      },
      metricas: {
        aptos: s.aptos,
        comparecimento: s.comparecimento,
        abstencoes: s.abstencoes,
        participacao,
        abstencao,
        total_votos: totalVotos,
        candidatos,
      },
      distancia_pp: {
        participacao: distanciaParticipacao,
        participacao_pp: distanciaParticipacao,
        abstencao: distanciaAbstencao,
        abstencao_pp: distanciaAbstencao,
        candidatos: distanciaCandidatos,
      },
      percentil: {
        participacao: percentilParticipacao,
        participacao_percentil: percentilParticipacao,
        abstencao: percentilAbstencao,
        abstencao_percentil: percentilAbstencao,
        candidatos: percentilCandidatos,
      },
      estado: secoes.length >= minimoGrupo ? 'ok' : 'dados_insuficientes',
    };
  });

  const estado = secoes.length >= minimoGrupo ? 'ok' : 'dados_insuficientes';
  const dadosInsuficientes = secoes.length < minimoGrupo;

  return {
    chave,
    nivel,
    identificacao: {
      sg_uf: secoes[0]?.sg_uf ?? null,
      cd_municipio_tse: secoes[0]?.cd_municipio_tse ?? null,
      nm_municipio: secoes[0]?.nm_municipio ?? null,
      nr_zona: nivel === 'municipio' ? null : secoes[0]?.nr_zona ?? null,
      nr_local_votacao: nivel === 'local' ? secoes[0]?.nr_local_votacao ?? null : null,
    },
    tamanho: secoes.length,
    aptos: {
      mediana: medianaAptos,
      min: minAptos,
      max: maxAptos,
    },
    metricas_grupo: {
      participacao: {
        mediana: medianaParticipacao,
        media: media(participacoes),
      },
      abstencao: {
        mediana: medianaAbstencao,
        media: media(abstencoesArr),
      },
      candidatos: metricasCandidatos,
    },
    secoes: secoesMetricas,
    estado,
    status: estado,
    dados_insuficientes: dadosInsuficientes,
  };
}

export function agruparSecoes(secoes = [], { minimoGrupo = 5 } = {}) {
  const normalizadas = (Array.isArray(secoes) ? secoes : []).map(normalizarSecao);

  const grupos = [];
  const pendentesLocal = [];

  const gruposLocal = agruparPor(normalizadas, chaveLocal);
  for (const [chave, lista] of gruposLocal) {
    const filtradas = aplicarEscala(lista);
    if (filtradas.length >= minimoGrupo) {
      grupos.push(criarGrupo(filtradas, lista[0]?.nr_local_votacao === null ? 'zona' : 'local', chave, minimoGrupo));
    } else {
      pendentesLocal.push(...lista);
    }
  }

  const pendentesZona = [];
  const gruposZona = agruparPor(pendentesLocal, chaveZona);
  for (const [chave, lista] of gruposZona) {
    const filtradas = aplicarEscala(lista);
    if (filtradas.length >= minimoGrupo) {
      grupos.push(criarGrupo(filtradas, 'zona', chave, minimoGrupo));
    } else {
      pendentesZona.push(...lista);
    }
  }

  const gruposMunicipio = agruparPor(pendentesZona, chaveMunicipio);
  for (const [chave, lista] of gruposMunicipio) {
    const filtradas = aplicarEscala(lista);
    grupos.push(criarGrupo(filtradas, 'municipio', chave, minimoGrupo));
  }

  const atribuidas = grupos.reduce((total, grupo) => total + grupo.tamanho, 0);
  const insuficientes = grupos.filter((g) => g.dados_insuficientes).length;

  return {
    grupos,
    total_grupos: grupos.length,
    total_secoes: atribuidas,
    cobertura: {
      consideradas: normalizadas.length,
      com_grupo: atribuidas,
      sem_grupo: normalizadas.length - atribuidas,
      grupos: grupos.length,
      grupos_insuficientes: insuficientes,
    },
  };
}

export async function comparacaoLocal(db, { eleicaoId, cargo, corte, escopo = {} }) {
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
      sql`max(bv.qt_comparecimento)`.as('qt_comparecimento'),
      sql`max(bv.qt_abstencoes)`.as('qt_abstencoes'),
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(rv.sg_partido)`.as('sg_partido'),
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.categoria', '=', 'nominal')
    .where('rv.qt_votos', 'is not', null)
    .groupBy([
      'bv.secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'rv.nr_votavel',
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
        qt_aptos: toNumberOrNull(linha.qt_aptos),
        qt_comparecimento: toNumberOrNull(linha.qt_comparecimento),
        qt_abstencoes: toNumberOrNull(linha.qt_abstencoes),
        candidatos: [],
      });
    }
    const secao = porSecao.get(linha.secao_id);
    secao.candidatos.push({
      nr_votavel: linha.nr_votavel,
      nm_votavel: linha.nm_votavel,
      sg_partido: linha.sg_partido,
      qt_votos: toNumberOrNull(linha.votos),
    });
  }

  const secoes = [...porSecao.values()];
  return agruparSecoes(secoes, { minimoGrupo: 5 });
}