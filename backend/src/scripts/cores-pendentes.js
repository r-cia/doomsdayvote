import { sql } from 'kysely';
import { loadWorkerEnv } from '../env.js';
import { criarDb } from '../db/index.js';

const env = loadWorkerEnv();
const db = criarDb({ connectionString: env.DATABASE_URL });

const { rows } = await sql`
  select coalesce(rv.sg_partido, rv.nm_partido) as partido, count(*)::int as votos
  from resultado_votavel rv
  left join partido_cor pc on pc.sg_partido = coalesce(rv.sg_partido, rv.nm_partido)
  where pc.sg_partido is null and coalesce(rv.sg_partido, rv.nm_partido) is not null
  group by 1
  order by 1
`.execute(db);

console.log(JSON.stringify(rows, null, 2));
await db.destroy();
