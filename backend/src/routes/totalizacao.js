import { z } from 'zod';
import { agregarMetricas, filtroLotes, lotesVigentes } from '../modules/totalizacao/agregacao.js';
import { TTL_CACHE_ESTATICO, tamanhoPagina } from './comum.js';

const recorteSchema = z.object({
  ano: z.coerce.number().int(),
  turno: z.coerce.number().int().min(1).max(2),
  uf: z.string().length(2).optional(),
  municipio: z.coerce.number().int().optional(),
  zona: z.coerce.number().int().optional(),
  secao: z.coerce.number().int().optional(),
  lote: z.string().uuid().optional(),
});

const paginacaoSchema = {
  pagina: z.coerce.number().int().min(1).default(1),
  tamanho: z.coerce.number().int().min(1).optional(),
};

const incidentesSchema = recorteSchema.extend(paginacaoSchema);

const divergenciasSchema = incidentesSchema.extend({
  fonte: z.enum(['rdv', 'log', 'bweb']).optional(),
});

const FILTROS_LOCALIDADE = Object.freeze([
  ['sgUf', 'sg_uf'],
  ['cdMunicipioTse', 'cd_municipio_tse'],
  ['nrZona', 'nr_zona'],
  ['nrSecao', 'nr_secao'],
]);

function recorteDe(query) {
  return {
    anoEleicao: query.ano,
    nrTurno: query.turno,
    loteId: query.lote,
    sgUf: query.uf,
    cdMunicipioTse: query.municipio,
    nrZona: query.zona,
    nrSecao: query.secao,
  };
}

function aplicarLocalidade(consulta, recorte, alias) {
  let filtrada = consulta;
  for (const [chave, coluna] of FILTROS_LOCALIDADE) {
    if (recorte[chave] !== undefined) {
      filtrada = filtrada.where(`${alias}.${coluna}`, '=', recorte[chave]);
    }
  }
  return filtrada;
}

function baseIncidentes(db, recorte, lotes) {
  const consulta = db
    .selectFrom('totalizacao_incidente as i')
    .innerJoin('totalizacao_secao as s', 's.id', 'i.totalizacao_secao_id')
    .where('s.ano_eleicao', '=', recorte.anoEleicao)
    .where('s.nr_turno', '=', recorte.nrTurno);

  return aplicarLocalidade(consulta, recorte, 's').where(filtroLotes(lotes, 's'));
}

function baseDivergencias(db, recorte, lotes) {
  const consulta = db.selectFrom('totalizacao_divergencia as d');
  return aplicarLocalidade(consulta, recorte, 'd').where(filtroLotes(lotes, 'd'));
}

export function registrarTotalizacao({ app, db, cacheado }) {
  app.get(
    '/api/totalizacao/metricas',
    cacheado('totalizacao-metricas', TTL_CACHE_ESTATICO, recorteSchema, async (query) =>
      agregarMetricas(db, recorteDe(query)),
    ),
  );

  app.get(
    '/api/totalizacao/incidentes',
    cacheado('totalizacao-incidentes', 60, incidentesSchema, async (query) => {
      const tamanho = tamanhoPagina(app, { page_size: query.tamanho });
      const recorte = recorteDe(query);
      const lotes = await lotesVigentes(db, recorte);

      const [itens, total] = await Promise.all([
        baseIncidentes(db, recorte, lotes)
          .select([
            'i.dt_incidente as instante',
            'i.nivel',
            'i.tipo',
            'i.texto_original',
            's.sg_uf',
            's.cd_municipio_tse',
            's.nr_zona',
            's.nr_secao',
          ])
          .orderBy('i.dt_incidente', 'desc')
          .orderBy('i.id', 'desc')
          .limit(tamanho)
          .offset((query.pagina - 1) * tamanho)
          .execute(),
        baseIncidentes(db, recorte, lotes)
          .select((eb) => eb.fn.countAll().as('total'))
          .executeTakeFirst(),
      ]);

      return { itens, total: Number(total.total), pagina: query.pagina, tamanho };
    }),
  );

  app.get(
    '/api/totalizacao/divergencias',
    cacheado('totalizacao-divergencias', 60, divergenciasSchema, async (query) => {
      const tamanho = tamanhoPagina(app, { page_size: query.tamanho });
      const recorte = recorteDe(query);
      const lotes = await lotesVigentes(db, recorte);
      const comFonte = (consulta) =>
        query.fonte === undefined ? consulta : consulta.where('d.fonte', '=', query.fonte);

      const [itens, total] = await Promise.all([
        comFonte(baseDivergencias(db, recorte, lotes))
          .selectAll('d')
          .orderBy('d.sg_uf')
          .orderBy('d.cd_municipio_tse')
          .orderBy('d.nr_zona')
          .orderBy('d.nr_secao')
          .orderBy('d.fonte')
          .orderBy('d.campo')
          .orderBy('d.id')
          .limit(tamanho)
          .offset((query.pagina - 1) * tamanho)
          .execute(),
        comFonte(baseDivergencias(db, recorte, lotes))
          .select((eb) => eb.fn.countAll().as('total'))
          .executeTakeFirst(),
      ]);

      return { itens, total: Number(total.total), pagina: query.pagina, tamanho };
    }),
  );
}
