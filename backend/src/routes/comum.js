import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { avisosCorte, metadadosCorte } from '../modules/apuracao/corte.js';

export const corteSchema = {
  as_of: z.string().optional(),
  as_of_date: z.string().optional(),
};

export const baseSchema = z.object({
  election_id: z.string().uuid(),
  cargo: z.coerce.number().int(),
  uf: z.string().length(2).optional(),
  municipio: z.coerce.number().int().optional(),
  ...corteSchema,
});

const TTL_CACHE_ESTATICO = 86400;

function escopoCache(query) {
  return {
    election_id: query.election_id,
    cargo: query.cargo,
    uf: query.uf,
    municipio: query.municipio,
    as_of: query.as_of,
    as_of_date: query.as_of_date,
  };
}

function cacheDeCorte(cache, recurso, query, calcular) {
  return cache.obter(recurso, escopoCache(query), TTL_CACHE_ESTATICO, calcular).then(({ valor }) => valor);
}

export function escopoDe(query) {
  return { sgUf: query.uf, cdMunicipio: query.municipio };
}

export function escopoDaEleicao(query, eleicao, corte) {
  return { eleicaoId: eleicao.id, cargo: query.cargo, corte, escopo: escopoDe(query) };
}

export function metadadosEAvisos(cache, db, query, escopo, corte) {
  return Promise.all([
    cacheDeCorte(cache, 'metadados', query, () => metadadosCorte(db, escopo, corte)),
    cacheDeCorte(cache, 'avisos', query, () => avisosCorte(db, escopo, corte)),
  ]);
}

export function tamanhoPagina(app, query) {
  const padrao = app.config?.SECTIONS_PAGE_SIZE_DEFAULT ?? 50;
  const maximo = app.config?.SECTIONS_PAGE_SIZE_MAX ?? 200;
  return Math.min(query.page_size ?? padrao, maximo);
}

export async function buscarEleicao(db, id) {
  const eleicao = await db
    .selectFrom('eleicao')
    .select([
      'id',
      'ano_eleicao',
      'cd_eleicao',
      'cd_pleito',
      'nr_turno',
      'dt_pleito',
      'dt_eleicao',
      'nm_tipo_eleicao',
      'ds_eleicao',
      'metadados_derivados',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
  if (!eleicao) throw new AppError('NOT_FOUND', 404, 'Eleição não encontrada');
  return eleicao;
}
