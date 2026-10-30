import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from './corte.js';

function base(db, { eleicaoId, cargo, corte, escopo = {} }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corte);
  return aplicarEscopo(qb, escopo);
}

export async function somarVotos(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const linhas = await base(db, { eleicaoId, cargo, corte, escopo })
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .leftJoin('partido_cor as pc', (join) => join.on(sql`pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)`))
    .select([
      'rv.cd_tipo_votavel',
      'rv.nr_votavel',
      'rv.categoria',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(rv.nr_partido)`.as('nr_partido'),
      sql`max(rv.sg_partido)`.as('sg_partido'),
      sql`max(rv.nm_partido)`.as('nm_partido'),
      sql`max(pc.cor_hex)`.as('cor_hex'),
      sql`sum(rv.qt_votos)`.as('qt_votos'),
    ])
    .where('rv.qt_votos', 'is not', null)
    .groupBy(['rv.cd_tipo_votavel', 'rv.nr_votavel', 'rv.categoria'])
    .execute();

  const baseValidos = linhas
    .filter((linha) => linha.categoria === 'nominal' || linha.categoria === 'legenda')
    .reduce((total, linha) => total + Number(linha.qt_votos), 0);

  return linhas
    .map((linha) => ({
      cd_tipo_votavel: linha.cd_tipo_votavel,
      nr_votavel: linha.nr_votavel,
      nm_votavel: linha.nm_votavel,
      categoria: linha.categoria,
      nr_partido: linha.nr_partido,
      sg_partido: linha.sg_partido,
      nm_partido: linha.nm_partido,
      cor_hex: linha.cor_hex,
      qt_votos: Number(linha.qt_votos),
      percentual: baseValidos > 0 ? (Number(linha.qt_votos) / baseValidos) * 100 : null,
    }))
    .sort((a, b) => b.qt_votos - a.qt_votos);
}

export async function somarMetricasSecao(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const linha = await base(db, { eleicaoId, cargo, corte, escopo })
    .select([
      sql`coalesce(sum(bv.qt_aptos), 0)`.as('qt_aptos'),
      sql`coalesce(sum(bv.qt_comparecimento), 0)`.as('qt_comparecimento'),
      sql`coalesce(sum(bv.qt_abstencoes), 0)`.as('qt_abstencoes'),
      sql`count(*)`.as('bus_considerados'),
      sql`count(*) filter (where bv.qt_aptos is null)`.as('bus_sem_aptos'),
      sql`count(*) filter (where bv.qt_comparecimento is null)`.as('bus_sem_comparecimento'),
      sql`count(*) filter (where bv.qt_abstencoes is null)`.as('bus_sem_abstencoes'),
    ])
    .executeTakeFirstOrThrow();

  return {
    qt_aptos: Number(linha.qt_aptos),
    qt_comparecimento: Number(linha.qt_comparecimento),
    qt_abstencoes: Number(linha.qt_abstencoes),
    bus_considerados: Number(linha.bus_considerados),
    bus_sem_aptos: Number(linha.bus_sem_aptos),
    bus_sem_comparecimento: Number(linha.bus_sem_comparecimento),
    bus_sem_abstencoes: Number(linha.bus_sem_abstencoes),
  };
}

export async function totaisPorArea(db, { eleicaoId, cargo, corte, nivel = 'uf', sgUf, candidatos = [] }) {
  const coluna = nivel === 'uf' ? 's.sg_uf' : 's.cd_municipio_tse';
  const linhas = await base(db, { eleicaoId, cargo, corte, escopo: sgUf ? { sgUf } : {} })
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .leftJoin('localidade as l', (join) =>
      join
        .onRef('l.sg_uf', '=', 's.sg_uf')
        .onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .leftJoin('partido_cor as pc', (join) => join.on(sql`pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)`))
    .select([coluna, 'rv.nr_votavel', 'rv.categoria', sql`max(pc.cor_hex)`.as('cor_hex'), sql`max(l.geom_id)`.as('geom_id'), sql`max(l.nm_municipio)`.as('nm_municipio'), sql`sum(rv.qt_votos)`.as('qt_votos')])
    .where('rv.qt_votos', 'is not', null)
    .groupBy([coluna, 'rv.nr_votavel', 'rv.categoria'])
    .execute();

  const areas = new Map();

  for (const linha of linhas) {
    const chave = nivel === 'uf' ? linha.sg_uf : linha.cd_municipio_tse;
    if (!areas.has(chave)) {
      areas.set(chave, {
        [nivel === 'uf' ? 'sg_uf' : 'cd_municipio_tse']: chave,
        geom_id: linha.geom_id ?? null,
        nm_municipio: linha.nm_municipio ?? null,
        total_votos: 0,
        votos_validos: 0,
        lider: null,
        candidatos: [],
      });
    }

    const area = areas.get(chave);
    const votos = Number(linha.qt_votos);
    area.total_votos += votos;
    if (linha.categoria === 'nominal' || linha.categoria === 'legenda') {
      area.votos_validos += votos;
    }
    if (linha.categoria === 'nominal' && (!area.lider || votos > area.lider.qt_votos)) {
      area.lider = { nr_votavel: linha.nr_votavel, qt_votos: votos, cor_hex: linha.cor_hex };
    }
    if (Array.isArray(candidatos) && candidatos.length > 0 && candidatos.includes(Number(linha.nr_votavel))) {
      area.candidatos.push({ nr_votavel: linha.nr_votavel, qt_votos: votos, cor_hex: linha.cor_hex });
    }
  }

  return [...areas.values()].map((area) => ({
    ...area,
    lider: area.lider
      ? { ...area.lider, percentual: area.votos_validos > 0 ? (area.lider.qt_votos / area.votos_validos) * 100 : null }
      : null,
    candidatos: area.candidatos.map((candidato) => ({
      ...candidato,
      percentual: area.votos_validos > 0 ? (candidato.qt_votos / area.votos_validos) * 100 : null,
    })),
  }));
}
