import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { loadWorkerEnv } from '../env.js';
import { criarDb } from '../db/index.js';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));
const geoDir = path.join(raiz, 'frontend/public/geo');
const correspondencia = path.join(raiz, 'backend/data/geo/municipios-tse-ibge.csv');
const env = loadWorkerEnv();
const db = criarDb({ connectionString: env.DATABASE_URL });

const linhas = (await readFile(correspondencia, 'utf8')).trim().split('\n').slice(1);
const tse = [];
const ibge = [];
const uf = [];

for (const linha of linhas) {
  const [cdTse, cdIbge, , sgUf] = linha.split(';');
  if (!cdTse || !cdIbge || !sgUf) continue;
  tse.push(Number(cdTse));
  ibge.push(Number(cdIbge));
  uf.push(sgUf);
}

const atualizacao = await sql`
  update localidade l
  set cd_municipio_ibge = c.ibge, geom_id = c.ibge::text
  from (
    select unnest(${tse}::int[]) as tse, unnest(${ibge}::int[]) as ibge, unnest(${uf}::text[]) as uf
  ) c
  where l.cd_municipio_tse = c.tse and l.sg_uf = c.uf
`.execute(db);

const malhas = [
  {
    nivel: 'uf',
    arquivo: 'br-uf.geojson',
    fonte: 'IBGE',
    versao: '2022',
    url: 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/Brasil/BR/BR_UF_2022.zip',
  },
  {
    nivel: 'municipio',
    arquivo: 'br-municipios.geojson',
    fonte: 'IBGE',
    versao: '2022',
    url: 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/Brasil/BR/BR_Municipios_2022.zip',
  },
];

const manifesto = {};

for (const malha of malhas) {
  const caminho = path.join(geoDir, malha.arquivo);
  const conteudo = await readFile(caminho);
  const geojson = JSON.parse(conteudo.toString('utf8'));
  const sha256 = createHash('sha256').update(conteudo).digest('hex');
  const qtFeatures = geojson.features.length;
  const arquivo = `frontend/public/geo/${malha.arquivo}`;

  manifesto[malha.nivel] = { ...malha, sha256, qt_features: qtFeatures };

  await db
    .insertInto('malha_geografica')
    .values({
      nivel: malha.nivel,
      versao: malha.versao,
      fonte: malha.fonte,
      arquivo,
      sha256,
      qt_features: qtFeatures,
    })
    .onConflict((oc) =>
      oc.columns(['nivel', 'versao']).doUpdateSet({
        fonte: malha.fonte,
        arquivo,
        sha256,
        qt_features: qtFeatures,
        carregada_em: new Date(),
      }),
    )
    .execute();
}

manifesto.correspondencia = {
  fonte: 'TSE',
  url: 'https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip',
  arquivo: 'backend/data/geo/municipios-tse-ibge.csv',
  linhas: tse.length,
};

await writeFile(path.join(geoDir, 'manifesto.json'), JSON.stringify(manifesto, null, 2));

console.log(
  JSON.stringify(
    {
      municipios_atualizados: String(atualizacao.numUpdatedRows ?? 0),
      malhas: malhas.map((malha) => malha.nivel),
      correspondencia: tse.length,
    },
    null,
    2,
  ),
);

await db.destroy();
