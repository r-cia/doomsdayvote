import { sql } from 'kysely';
import { aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';

const REGRAS = [
  'comparecimento_vs_votos',
  'aptos_vs_comparecimento_abstencao',
  'comparecimento_vs_aptos',
  'biometria_vs_comparecimento',
];

function ausente(valor) {
  return valor === null || valor === undefined;
}

export function validarConsistenciaBu(bu = {}, resultados = []) {
  const b = bu ?? {};
  const regras = [];

  // comparecimento_vs_votos
  {
    const comparecimento = b.qt_comparecimento;
    const lista = Array.isArray(resultados) ? resultados : null;
    const agregado = !lista && resultados && typeof resultados === 'object' ? resultados : null;
    let soma = lista ? 0 : Number(agregado?.somaVotos ?? 0);
    let temNulo = agregado?.temVotosNulos === true;
    let insuficiente =
      ausente(comparecimento) ||
      (lista === null && agregado === null) ||
      agregado?.temResultados === false;
    if (lista) {
      for (const item of lista) {
        if (ausente(item?.qt_votos)) {
          temNulo = true;
        } else {
          soma += Number(item.qt_votos);
        }
      }
    }
    if (temNulo) insuficiente = true;
    const diferenca = insuficiente ? null : soma - Number(comparecimento);
    regras.push({
      regra: 'comparecimento_vs_votos',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca === 0
          ? 'ok'
          : 'divergente',
      diferenca,
      campos: ['qt_comparecimento', 'qt_votos'],
      valores: {
        qt_comparecimento: comparecimento ?? null,
        soma_qt_votos: insuficiente ? null : soma,
      },
    });
  }

  // aptos_vs_comparecimento_abstencao
  {
    const aptos = b.qt_aptos;
    const comparecimento = b.qt_comparecimento;
    const abstencoes = b.qt_abstencoes;
    const insuficiente = ausente(aptos) || ausente(comparecimento) || ausente(abstencoes);
    const soma = insuficiente ? null : Number(comparecimento) + Number(abstencoes);
    const diferenca = insuficiente ? null : Number(aptos) - soma;
    regras.push({
      regra: 'aptos_vs_comparecimento_abstencao',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca === 0
          ? 'ok'
          : 'divergente',
      diferenca,
      campos: ['qt_aptos', 'qt_comparecimento', 'qt_abstencoes'],
      valores: {
        qt_aptos: aptos ?? null,
        qt_comparecimento: comparecimento ?? null,
        qt_abstencoes: abstencoes ?? null,
        soma_comparecimento_abstencoes: soma,
      },
    });
  }

  // comparecimento_vs_aptos
  {
    const comparecimento = b.qt_comparecimento;
    const aptos = b.qt_aptos;
    const insuficiente = ausente(comparecimento) || ausente(aptos);
    const diferenca = insuficiente ? null : Number(comparecimento) - Number(aptos);
    regras.push({
      regra: 'comparecimento_vs_aptos',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca > 0
          ? 'divergente'
          : 'ok',
      diferenca,
      campos: ['qt_comparecimento', 'qt_aptos'],
      valores: {
        qt_comparecimento: comparecimento ?? null,
        qt_aptos: aptos ?? null,
      },
    });
  }

  // biometria_vs_comparecimento
  {
    const biometria = b.qt_elei_biom_sem_habilitacao;
    const comparecimento = b.qt_comparecimento;
    const insuficiente = ausente(biometria) || ausente(comparecimento);
    const diferenca = insuficiente ? null : Number(biometria) - Number(comparecimento);
    regras.push({
      regra: 'biometria_vs_comparecimento',
      status: insuficiente
        ? 'dados_insuficientes'
        : diferenca > 0
          ? 'divergente'
          : 'ok',
      diferenca,
      campos: ['qt_elei_biom_sem_habilitacao', 'qt_comparecimento'],
      valores: {
        qt_elei_biom_sem_habilitacao: biometria ?? null,
        qt_comparecimento: comparecimento ?? null,
      },
    });
  }

  return regras;
}

export async function consistenciaPorSecao(db, { eleicaoId, cargo, corte, escopo }) {
  const corteEfetivo = corte ?? { tipo: 'final' };
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .leftJoin('localidade as l', (join) =>
      join.onRef('l.sg_uf', '=', 's.sg_uf').onRef('l.cd_municipio_tse', '=', 's.cd_municipio_tse'),
    )
    .leftJoin('lote_importacao as lot', 'lot.id', 'bv.lote_id')
    .leftJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);

  qb = aplicarFiltroCorte(qb, corteEfetivo);
  qb = aplicarEscopo(qb, escopo ?? {});

  const boletins = await qb
    .select([
      's.id as secao_id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'l.nm_municipio',
      'bv.id as bu_id',
      'bv.versao',
      'bv.qt_aptos',
      'bv.qt_comparecimento',
      'bv.qt_abstencoes',
      'bv.qt_elei_biom_sem_habilitacao',
      'bv.dt_abertura',
      'bv.dt_encerramento',
      'bv.dt_emissao_bu',
      'bv.dt_bu_recebido_ts',
      'bv.dt_bu_recebido_data',
      'bv.imported_at',
      'lot.id as lote_id',
      'lot.nome_arquivo as lote_nome',
      'lot.sha256 as lote_sha256',
      'lot.dt_geracao_arquivo',
      'lot.captured_at',
      sql`coalesce(sum(rv.qt_votos), 0)::bigint`.as('soma_votos'),
      sql`count(rv.id)::int`.as('resultados_considerados'),
      sql`coalesce(bool_or(rv.qt_votos is null) filter (where rv.id is not null), false)`.as('tem_votos_nulos'),
    ])
    .groupBy([
      's.id',
      's.sg_uf',
      's.cd_municipio_tse',
      's.nr_zona',
      's.nr_secao',
      's.nr_local_votacao',
      'l.nm_municipio',
      'bv.id',
      'bv.versao',
      'bv.qt_aptos',
      'bv.qt_comparecimento',
      'bv.qt_abstencoes',
      'bv.qt_elei_biom_sem_habilitacao',
      'bv.dt_abertura',
      'bv.dt_encerramento',
      'bv.dt_emissao_bu',
      'bv.dt_bu_recebido_ts',
      'bv.dt_bu_recebido_data',
      'bv.imported_at',
      'lot.id',
      'lot.nome_arquivo',
      'lot.sha256',
      'lot.dt_geracao_arquivo',
      'lot.captured_at',
    ])
    .execute();

  const secoes = boletins.map((b) => {
    const buObj = {
      qt_aptos: b.qt_aptos,
      qt_comparecimento: b.qt_comparecimento,
      qt_abstencoes: b.qt_abstencoes,
      qt_elei_biom_sem_habilitacao: b.qt_elei_biom_sem_habilitacao,
    };
    const regras = validarConsistenciaBu(buObj, {
      somaVotos: b.soma_votos,
      temResultados: Number(b.resultados_considerados) > 0,
      temVotosNulos: b.tem_votos_nulos,
    });
    return {
      secao: {
        id: b.secao_id,
        sg_uf: b.sg_uf,
        cd_municipio_tse: b.cd_municipio_tse,
        nm_municipio: b.nm_municipio,
        nr_zona: b.nr_zona,
        nr_secao: b.nr_secao,
        nr_local_votacao: b.nr_local_votacao,
      },
      regras,
      divergente: regras.some((r) => r.status === 'divergente'),
      bu: {
        id: b.bu_id,
        versao: b.versao,
        lote: { id: b.lote_id, nome: b.lote_nome },
        sha256: b.lote_sha256,
        timestamps: {
          dt_abertura: b.dt_abertura,
          dt_encerramento: b.dt_encerramento,
          dt_emissao_bu: b.dt_emissao_bu,
          dt_bu_recebido_ts: b.dt_bu_recebido_ts,
          dt_bu_recebido_data: b.dt_bu_recebido_data,
          imported_at: b.imported_at,
          dt_geracao_arquivo: b.dt_geracao_arquivo,
          captured_at: b.captured_at,
        },
      },
    };
  });

  const semCampoPorRegra = Object.fromEntries(REGRAS.map((regra) => [regra, 0]));
  const divergenciasPorRegra = Object.fromEntries(REGRAS.map((regra) => [regra, 0]));
  let avaliadas = 0;
  let semDivergencia = 0;
  for (const secao of secoes) {
    let avaliavel = false;
    for (const regra of secao.regras) {
      if (regra.status === 'dados_insuficientes') semCampoPorRegra[regra.regra] += 1;
      else {
        avaliavel = true;
        if (regra.status === 'divergente') divergenciasPorRegra[regra.regra] += 1;
      }
    }
    if (avaliavel) {
      avaliadas += 1;
      if (!secao.divergente) semDivergencia += 1;
    }
  }

  return {
    secoes,
    cobertura: {
      consideradas: secoes.length,
      com_divergencia: secoes.filter((s) => s.divergente).length,
      avaliadas,
      sem_divergencia: semDivergencia,
      sem_campo_por_regra: semCampoPorRegra,
      divergencias_por_regra: divergenciasPorRegra,
    },
  };
}
