import { sql } from 'kysely'
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js'
import { calcularBenford } from './benford.js'

export const MINIMO_VOTOS_BENFORD = 10

function base(db, { eleicaoId, cargo, corte, escopo = {} }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo)

  qb = aplicarFiltroCorte(qb, corte)
  return aplicarEscopo(qb, escopo)
}

export async function composicaoBiometria(db, { eleicaoId, cargo, corte, escopo = {} }) {
  const linha = await base(db, { eleicaoId, cargo, corte, escopo })
    .select([
      sql`coalesce(sum(bv.qt_aptos), 0)`.as('qt_aptos'),
      sql`coalesce(sum(bv.qt_comparecimento), 0)`.as('qt_comparecimento'),
      sql`coalesce(sum(bv.qt_elei_biom_sem_habilitacao), 0)`.as('qt_nao_habilitada'),
      sql`count(*)`.as('secoes'),
      sql`count(*) filter (where bv.qt_elei_biom_sem_habilitacao is null)`.as('secoes_sem_campo'),
    ])
    .executeTakeFirstOrThrow()

  const comparecimento = Number(linha.qt_comparecimento)
  const naoHabilitada = Number(linha.qt_nao_habilitada)
  const habilitada = Math.max(0, comparecimento - naoHabilitada)
  const aptos = Number(linha.qt_aptos)

  return {
    secoes: Number(linha.secoes),
    secoes_sem_campo: Number(linha.secoes_sem_campo),
    qt_aptos: aptos,
    qt_comparecimento: comparecimento,
    qt_habilitados_por_biometria: habilitada,
    qt_biometria_nao_habilitada: naoHabilitada,
    percentual_comparecimento: aptos > 0 ? (comparecimento / aptos) * 100 : null,
    percentual_habilitada:
      comparecimento > 0 ? (habilitada / comparecimento) * 100 : null,
    percentual_nao_habilitada:
      comparecimento > 0 ? (naoHabilitada / comparecimento) * 100 : null,
  }
}

export async function benfordPorCandidato(
  db,
  { eleicaoId, cargo, corte, escopo = {}, minimoVotos = MINIMO_VOTOS_BENFORD },
) {
  const linhas = await base(db, { eleicaoId, cargo, corte, escopo })
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'rv.nr_votavel',
      sql`max(rv.nm_votavel)`.as('nm_votavel'),
      sql`max(rv.sg_partido)`.as('sg_partido'),
      'bv.secao_id',
      sql`sum(rv.qt_votos)`.as('votos'),
    ])
    .where('rv.categoria', '=', 'nominal')
    .where('rv.qt_votos', 'is not', null)
    .groupBy(['rv.nr_votavel', 'bv.secao_id'])
    .execute()

  const porCandidato = new Map()

  for (const linha of linhas) {
    const votos = Number(linha.votos)
    if (!porCandidato.has(linha.nr_votavel)) {
      porCandidato.set(linha.nr_votavel, {
        nr_votavel: linha.nr_votavel,
        nm_votavel: linha.nm_votavel,
        sg_partido: linha.sg_partido,
        total_votos: 0,
        contagens: [],
        secoes_abaixo_minimo: 0,
      })
    }

    const candidato = porCandidato.get(linha.nr_votavel)
    candidato.total_votos += votos
    if (votos >= minimoVotos) {
      candidato.contagens.push(votos)
    } else {
      candidato.secoes_abaixo_minimo += 1
    }
  }

  const candidatos = [...porCandidato.values()]
    .map((candidato) => ({
      nr_votavel: candidato.nr_votavel,
      nm_votavel: candidato.nm_votavel,
      sg_partido: candidato.sg_partido,
      total_votos: candidato.total_votos,
      secoes_abaixo_minimo: candidato.secoes_abaixo_minimo,
      ...calcularBenford(candidato.contagens),
    }))
    .sort((a, b) => b.total_votos - a.total_votos)

  return { minimo_votos: minimoVotos, candidatos }
}
