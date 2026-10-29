import { sql } from 'kysely';
import { z } from 'zod';
import { validar } from '../../lib/validar.js';

const FUSO_EXIBICAO = 'America/Sao_Paulo';

const corteSchema = z
  .object({
    as_of: z.string().optional(),
    as_of_date: z.string().optional(),
  })
  .superRefine((valores, ctx) => {
    if (valores.as_of && valores.as_of_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['as_of'],
        message: 'use as_of ou as_of_date, não ambos',
      });
    }

    if (valores.as_of) {
      if (!/(Z|[+-]\d{2}:\d{2})$/.test(valores.as_of) || Number.isNaN(Date.parse(valores.as_of))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['as_of'],
          message: 'as_of deve ser ISO 8601 com offset',
        });
      }
    }

    if (valores.as_of_date && !dataValida(valores.as_of_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['as_of_date'],
        message: 'as_of_date deve ser uma data válida YYYY-MM-DD',
      });
    }
  });

function dataValida(data) {
  const encontrado = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!encontrado) return false;
  const [, ano, mes, dia] = encontrado;
  const bissexto = (Number(ano) % 4 === 0 && Number(ano) % 100 !== 0) || Number(ano) % 400 === 0;
  const dias = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return Number(mes) >= 1 && Number(mes) <= 12 && Number(dia) >= 1 && Number(dia) <= dias[Number(mes) - 1];
}

export function resolverCorte(query = {}) {
  const dados = validar(corteSchema, query);
  if (dados.as_of) {
    return { tipo: 'recebimento_intradiario', instante: new Date(dados.as_of) };
  }
  if (dados.as_of_date) {
    return { tipo: 'recebimento_diario', data: dados.as_of_date };
  }
  return { tipo: 'final' };
}

export function aplicarEscopo(qb, escopo = {}) {
  let consulta = qb;
  if (escopo.sgUf) consulta = consulta.where('s.sg_uf', '=', escopo.sgUf);
  if (escopo.cdMunicipio) consulta = consulta.where('s.cd_municipio_tse', '=', escopo.cdMunicipio);
  if (escopo.nrZona) consulta = consulta.where('s.nr_zona', '=', escopo.nrZona);
  if (escopo.secaoId) consulta = consulta.where('s.id', '=', escopo.secaoId);
  return consulta;
}

export function aplicarFiltroCorte(qb, corte) {
  let consulta = qb.where('bv.ativo', '=', true).where('bv.cd_tipo_urna', '=', 1);

  if (corte.tipo === 'recebimento_intradiario') {
    consulta = consulta
      .where('bv.precisao_dt_bu_recebido', '=', 'DATA_HORA')
      .where('bv.dt_bu_recebido_ts', '<=', corte.instante);
  }

  if (corte.tipo === 'recebimento_diario') {
    consulta = consulta.where(sql`(
      (bv.precisao_dt_bu_recebido = 'DATA_HORA' AND (bv.dt_bu_recebido_ts AT TIME ZONE ${FUSO_EXIBICAO})::date <= ${corte.data})
      OR (bv.precisao_dt_bu_recebido = 'DATA' AND bv.dt_bu_recebido_data <= ${corte.data})
    )`);
  }

  return consulta;
}

function baseEscopo(db, { eleicaoId, cargo, escopo = {} }) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .where('bv.ativo', '=', true)
    .where('bv.cd_tipo_urna', '=', 1)
    .where('bv.eleicao_id', '=', eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', cargo);
  return aplicarEscopo(qb, escopo);
}

export async function contarAtivos(db, escopo) {
  const { total } = await baseEscopo(db, escopo)
    .select(({ fn }) => fn.countAll().as('total'))
    .executeTakeFirstOrThrow();
  return Number(total);
}

export async function contarExcluidosPorPrecisao(db, escopo, corte) {
  if (corte.tipo === 'final') return 0;

  let qb = baseEscopo(db, escopo);
  if (corte.tipo === 'recebimento_intradiario') {
    qb = qb.where('bv.precisao_dt_bu_recebido', 'in', ['DATA', 'AUSENTE']);
  } else {
    qb = qb.where('bv.precisao_dt_bu_recebido', '=', 'AUSENTE');
  }

  const { total } = await qb.select(({ fn }) => fn.countAll().as('total')).executeTakeFirstOrThrow();
  return Number(total);
}

export async function avisosCorte(db, escopo, corte) {
  const avisos = [];
  const excluidos = await contarExcluidosPorPrecisao(db, escopo, corte);

  if (excluidos > 0) {
    const total = await contarAtivos(db, escopo);
    if (total === excluidos) {
      avisos.push({
        codigo: 'CORTE_INDISPONIVEL',
        mensagem: 'A fonte deste ano não permite consulta por horário/dia de recebimento',
      });
    } else {
      avisos.push({
        codigo: 'PRECISAO_INSUFICIENTE',
        mensagem: `${excluidos} BUs desta seleção não têm horário de recebimento com a precisão pedida e não entram neste corte`,
        quantidade: excluidos,
      });
    }
  }

  const eleicao = await db
    .selectFrom('eleicao')
    .select('metadados_derivados')
    .where('id', '=', escopo.eleicaoId)
    .executeTakeFirst();

  if (eleicao?.metadados_derivados?.length > 0) {
    avisos.push({
      codigo: 'METADADOS_DERIVADOS',
      mensagem: 'Ano e turno derivados do nome do arquivo',
    });
  }

  return avisos;
}

export async function metadadosCorte(db, escopo, corte) {
  let qb = db
    .selectFrom('boletim_versao as bv')
    .innerJoin('secao_eleitoral as s', 's.id', 'bv.secao_id')
    .innerJoin('lote_importacao as l', 'l.id', 'bv.lote_id')
    .select(['l.id', 'l.nome_arquivo', 'l.sha256', 'l.dt_geracao_arquivo', 'l.captured_at'])
    .where('bv.eleicao_id', '=', escopo.eleicaoId)
    .where('bv.cd_cargo_pergunta', '=', escopo.cargo);

  qb = aplicarFiltroCorte(qb, corte);
  qb = aplicarEscopo(qb, escopo.escopo ?? {});

  const linhas = await qb.execute();
  const lotes = new Map();
  let source = null;
  let captured = null;

  for (const linha of linhas) {
    lotes.set(linha.id, { id: linha.id, nome_arquivo: linha.nome_arquivo, sha256: linha.sha256 });
    if (linha.dt_geracao_arquivo && (!source || linha.dt_geracao_arquivo > source)) {
      source = linha.dt_geracao_arquivo;
    }
    if (linha.captured_at && (!captured || linha.captured_at > captured)) {
      captured = linha.captured_at;
    }
  }

  return {
    source_updated_at: source?.toISOString() ?? null,
    captured_at: captured?.toISOString() ?? null,
    lotes: [...lotes.values()],
  };
}

export function corteResposta(corte) {
  if (corte.tipo === 'recebimento_intradiario') {
    return { tipo: corte.tipo, as_of: corte.instante.toISOString(), as_of_date: null, fuso_exibicao: FUSO_EXIBICAO };
  }
  if (corte.tipo === 'recebimento_diario') {
    return { tipo: corte.tipo, as_of: null, as_of_date: corte.data, fuso_exibicao: FUSO_EXIBICAO };
  }
  return { tipo: 'final', as_of: null, as_of_date: null, fuso_exibicao: FUSO_EXIBICAO };
}
