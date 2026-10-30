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
    let soma = 0;
    let temNulo = false;
    let insuficiente = ausente(comparecimento) || lista === null;
    if (lista) {
      for (const item of lista) {
        if (ausente(item?.qt_votos)) {
          temNulo = true;
        } else {
          soma += Number(item.qt_votos);
        }
      }
      if (temNulo) insuficiente = true;
    }
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
    ])
    .execute();

  const ids = boletins.map((b) => b.bu_id).filter(Boolean);
  const resultados = ids.length
    ? await db.selectFrom('resultado_votavel').selectAll().where('boletim_versao_id', 'in', ids).execute()
    : [];
  const porBu = new Map();
  for (const r of resultados) {
    if (!porBu.has(r.boletim_versao_id)) porBu.set(r.boletim_versao_id, []);
    porBu.get(r.boletim_versao_id).push(r);
  }

  const secoes = boletins.map((b) => {
    const res = porBu.get(b.bu_id) ?? [];
    const buObj = {
      qt_aptos: b.qt_aptos,
      qt_comparecimento: b.qt_comparecimento,
      qt_abstencoes: b.qt_abstencoes,
      qt_elei_biom_sem_habilitacao: b.qt_elei_biom_sem_habilitacao,
    };
    const regras = validarConsistenciaBu(buObj, res);
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

  const semCampoPorRegra = {};
  for (const nome of REGRAS) {
    semCampoPorRegra[nome] = secoes.reduce(
      (acc, s) => acc + (s.regras.find((r) => r.regra === nome)?.status === 'dados_insuficientes' ? 1 : 0),
      0,
    );
  }

  return {
    secoes,
    cobertura: {
      consideradas: secoes.length,
      com_divergencia: secoes.filter((s) => s.divergente).length,
      sem_campo_por_regra: semCampoPorRegra,
    },
  };
}