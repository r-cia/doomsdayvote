import { z } from 'zod';
import { compararAnos } from '../modules/comparacao-anos/comparar.js';
import { TTL_CACHE_ESTATICO } from './comum.js';

const comparacaoAnosSchema = z.object({
  anos: z
    .string()
    .transform((texto) => [...new Set(texto.split(',').map((valor) => Number(valor.trim())))])
    .pipe(z.array(z.number().int().min(1900).max(2200)).min(2)),
  uf: z.string().length(2).optional(),
});

export function registrarComparacaoAnos({ app, db, cacheado }) {
  app.get('/api/comparacao-anos', cacheado('comparacao-anos', TTL_CACHE_ESTATICO, comparacaoAnosSchema, (query) =>
    compararAnos(db, { anos: query.anos, uf: query.uf }),
  ));
}
