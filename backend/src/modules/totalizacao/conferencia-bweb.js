import { compararVotos } from './conferencia-rdv.js';
import { divergenciaDeAusencia, registrarDivergencias } from './divergencias.js';

const CARGOS_TOTALIZACAO = [1, 3];

function filtrarCargos(votos) {
  return votos.filter((voto) => CARGOS_TOTALIZACAO.includes(voto.cd_cargo_pergunta));
}

function divergenciasDeVotos({ buVotos, bwebVotos, sgUf, cdMunicipioTse, nrZona, nrSecao }) {
  return compararVotos({ esperados: buVotos, encontrados: bwebVotos }).map(
    ({ referencia, esperado, encontrado }) => ({
      fonte: 'bweb',
      campo: 'votos',
      sg_uf: sgUf,
      cd_municipio_tse: cdMunicipioTse,
      nr_zona: nrZona,
      nr_secao: nrSecao,
      cd_cargo_pergunta: referencia.cd_cargo_pergunta,
      nr_votavel: referencia.nr_votavel,
      valor_esperado: String(esperado),
      valor_encontrado: String(encontrado),
    }),
  );
}

export async function existeBwebDaUf(db, { anoEleicao, nrTurno, sgUf }) {
  const linha = await db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .select('bv.id')
    .where('bv.ativo', '=', true)
    .where('s.ano_eleicao', '=', anoEleicao)
    .where('s.nr_turno', '=', nrTurno)
    .where('s.sg_uf', '=', sgUf)
    .limit(1)
    .executeTakeFirst();

  return Boolean(linha);
}

export async function divergenciasBuBweb(
  db,
  { anoEleicao, nrTurno, votosBu, sgUf, cdMunicipioTse, nrZona, nrSecao },
) {
  const localizacao = { sgUf, cdMunicipioTse, nrZona, nrSecao };
  const divergencias = [];

  if (!(await existeBwebDaUf(db, { anoEleicao, nrTurno, sgUf }))) {
    divergencias.push(
      divergenciaDeAusencia({ fonte: 'bweb', campo: 'uf', ...localizacao }),
    );
    return divergencias;
  }

  const votosBweb = await db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .innerJoin('resultado_votavel as rv', 'rv.boletim_versao_id', 'bv.id')
    .select([
      'bv.cd_cargo_pergunta',
      'rv.cd_tipo_votavel',
      'rv.nr_votavel',
      'rv.qt_votos',
    ])
    .where('bv.ativo', '=', true)
    .where('s.ano_eleicao', '=', anoEleicao)
    .where('s.nr_turno', '=', nrTurno)
    .where('s.sg_uf', '=', sgUf)
    .where('s.cd_municipio_tse', '=', cdMunicipioTse)
    .where('s.nr_zona', '=', nrZona)
    .where('s.nr_secao', '=', nrSecao)
    .where('rv.qt_votos', 'is not', null)
    .execute();

  if (votosBweb.length === 0) {
    divergencias.push(
      divergenciaDeAusencia({ fonte: 'bweb', campo: 'secao', ...localizacao }),
    );
    return divergencias;
  }

  const votosRelevantes = filtrarCargos(votosBweb);

  divergencias.push(
    ...divergenciasDeVotos({
      buVotos: filtrarCargos(votosBu),
      bwebVotos: votosRelevantes,
      ...localizacao,
    }),
  );

  return divergencias;
}

export async function conferirBuBweb(db, { loteId, ...consulta }) {
  const divergencias = await divergenciasBuBweb(db, consulta);
  await registrarDivergencias(db, loteId, divergencias);
  return divergencias;
}
