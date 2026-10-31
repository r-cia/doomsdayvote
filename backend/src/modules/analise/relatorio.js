import { sql } from 'kysely';
import { CARGO_EM_ESCOPO, aplicarEscopo, aplicarFiltroCorte } from '../apuracao/corte.js';

const agregadosRelatorio = () => [
  sql`count(*)::int`.as('bus'),
  sql`count(*) filter (where bv.qt_aptos is null)::int`.as('sem_aptos'),
  sql`count(*) filter (where bv.qt_comparecimento is null)::int`.as('sem_comparecimento'),
  sql`count(*) filter (where bv.qt_abstencoes is null)::int`.as('sem_abstencoes'),
  sql`sum(bv.qt_aptos)::bigint`.as('aptos'),
  sql`sum(bv.qt_comparecimento)::bigint`.as('comparecimento'),
  sql`sum(bv.qt_abstencoes)::bigint`.as('abstencoes'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA')::int`.as('recebimento_hora'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA')::int`.as('recebimento_data'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'AUSENTE')::int`.as('recebimento_ausente'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido is null or bv.precisao_dt_bu_recebido not in ('DATA_HORA', 'DATA', 'AUSENTE'))::int`.as('recebimento_outra'),
  sql`count(*) filter (where bv.dt_encerramento is null)::int`.as('sem_encerramento'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null and bv.dt_bu_recebido_ts < bv.dt_encerramento)::int`.as('recebido_antes_encerramento'),
  sql`count(*) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_emissao_bu is not null and bv.dt_bu_recebido_ts < bv.dt_emissao_bu)::int`.as('recebido_antes_emissao'),
  sql`percentile_cont(0.5) within group (order by extract(epoch from (bv.dt_bu_recebido_ts - bv.dt_encerramento)) / 60) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null)`.as('mediana_atraso_min'),
  sql`percentile_cont(0.9) within group (order by extract(epoch from (bv.dt_bu_recebido_ts - bv.dt_encerramento)) / 60) filter (where bv.precisao_dt_bu_recebido = 'DATA_HORA' and bv.dt_bu_recebido_ts is not null and bv.dt_encerramento is not null)`.as('p90_atraso_min'),
];

function metricas(dados) {
  const bus = Number(dados.bus);
  const aptos = Number(dados.sem_aptos) === 0 && dados.aptos !== null ? Number(dados.aptos) : null;
  const comparecimento =
    Number(dados.sem_comparecimento) === 0 && dados.comparecimento !== null
      ? Number(dados.comparecimento)
      : null;
  const abstencoes =
    Number(dados.sem_abstencoes) === 0 && dados.abstencoes !== null
      ? Number(dados.abstencoes)
      : null;
  const numeroOpcional = (valor) => (valor === null || valor === undefined ? null : Number(valor));
  return {
    bus,
    aptos,
    comparecimento,
    abstencoes,
    participacao_pct: aptos > 0 && comparecimento !== null ? (comparecimento / aptos) * 100 : null,
    abstencao_pct: aptos > 0 && abstencoes !== null ? (abstencoes / aptos) * 100 : null,
    cobertura: {
      sem_aptos: Number(dados.sem_aptos),
      sem_comparecimento: Number(dados.sem_comparecimento),
      sem_abstencoes: Number(dados.sem_abstencoes),
    },
    recebimento: {
      data_hora: Number(dados.recebimento_hora),
      somente_data: Number(dados.recebimento_data),
      ausente: Number(dados.recebimento_ausente),
      outra_precisao: Number(dados.recebimento_outra),
      sem_encerramento: Number(dados.sem_encerramento),
      antes_encerramento: Number(dados.recebido_antes_encerramento),
      antes_emissao: Number(dados.recebido_antes_emissao),
      mediana_atraso_min: numeroOpcional(dados.mediana_atraso_min),
      p90_atraso_min: numeroOpcional(dados.p90_atraso_min),
    },
  };
}

export async function relatorioDaEleicao(db, { eleicao, cargo, corte, escopo }) {
  let atualQuery = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.eleicao_id', '=', eleicao.id)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  atualQuery = aplicarFiltroCorte(aplicarEscopo(atualQuery, escopo), corte);

  const resumoAtual = await atualQuery
    .select(agregadosRelatorio())
    .executeTakeFirstOrThrow();

  let referencias = [];
  if (corte.tipo === 'final') {
    let referenciasQuery = db
      .selectFrom('boletim_versao as bv')
      .innerJoin('eleicao as e', 'e.id', 'bv.eleicao_id')
      .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
      .where('bv.ativo', '=', true)
      .where('bv.cd_tipo_urna', '=', 1)
      .where(CARGO_EM_ESCOPO)
      .where('bv.cd_cargo_pergunta', '=', cargo)
      .where('e.id', '!=', eleicao.id);
    referenciasQuery = eleicao.nm_tipo_eleicao
      ? referenciasQuery.where('e.nm_tipo_eleicao', '=', eleicao.nm_tipo_eleicao)
      : referenciasQuery.where('e.nm_tipo_eleicao', 'is', null);
    referenciasQuery = aplicarEscopo(referenciasQuery, escopo);
    referencias = await referenciasQuery
      .select([
        'e.id as election_id',
        'e.ano_eleicao',
        'e.nr_turno',
        'e.cd_eleicao',
        'e.cd_pleito',
        'e.ds_eleicao',
        ...agregadosRelatorio(),
      ])
      .groupBy(['e.id', 'e.ano_eleicao', 'e.nr_turno', 'e.cd_eleicao', 'e.cd_pleito', 'e.ds_eleicao'])
      .orderBy('e.ano_eleicao', 'desc')
      .orderBy('e.nr_turno', 'desc')
      .execute();
  }

  const alvo = {
    election_id: eleicao.id,
    ano_eleicao: eleicao.ano_eleicao,
    nr_turno: eleicao.nr_turno,
    cd_eleicao: eleicao.cd_eleicao,
    cd_pleito: eleicao.cd_pleito,
    ds_eleicao: eleicao.ds_eleicao,
    ...metricas(resumoAtual),
  };

  return {
    alvo,
    referencias: referencias.map((referencia) => ({
      election_id: referencia.election_id,
      ano_eleicao: referencia.ano_eleicao,
      nr_turno: referencia.nr_turno,
      cd_eleicao: referencia.cd_eleicao,
      cd_pleito: referencia.cd_pleito,
      ds_eleicao: referencia.ds_eleicao,
      ...metricas(referencia),
    })),
  };
}
