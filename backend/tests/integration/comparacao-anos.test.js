import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../../src/app.js';
import { criarDb } from '../../src/db/index.js';
import { importarArquivo } from '../../src/modules/importacao/importar-arquivo.js';
import { registrarRotas } from '../../src/routes/index.js';
import { atualizarViews, limparBanco } from '../helpers/db-teste.js';
import { caminhoFixture } from '../helpers/fixtures.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL não definida');

const db = criarDb({ connectionString: url });
const app = buildApp({
  deps: { db },
  config: { SECTIONS_PAGE_SIZE_DEFAULT: 50, SECTIONS_PAGE_SIZE_MAX: 200 },
  rotas: registrarRotas,
});

let storageDir;

describe('GET /api/comparacao-anos', () => {
  beforeAll(async () => {
    storageDir = await mkdtemp(path.join(tmpdir(), 'bweb-comparacao-anos-'));
  });

  beforeEach(async () => {
    await limparBanco(db);
    for (const nome of ['bweb-1t_ac_2026.csv', 'bweb_1t_AC_051020221321.csv', 'bweb_1t_AC_14102014131600.txt']) {
      await importarArquivo({ db, caminho: caminhoFixture(nome), nomeArquivo: nome, storageDir });
    }
    await atualizarViews(db);
  });

  afterAll(async () => {
    await limparBanco(db);
    await db.destroy();
    await rm(storageDir, { recursive: true, force: true });
  });

  it(
    'devolve candidatos, curvas e correlação entre anos com horário, e aviso para ano sem horário',
    async () => {
      const resposta = await app.inject({ method: 'GET', url: '/api/comparacao-anos?anos=2014,2022,2026' });
      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json();

      expect(corpo.avisos).toEqual([{ ano: 2014, codigo: 'SEM_HORARIO' }]);
      expect(corpo.anos.map((ano) => ano.ano)).toEqual([2022, 2026]);

      for (const ano of corpo.anos) {
        const turno = ano.turnos.find((item) => item.turno === 1);
        expect(turno.candidatos).toHaveLength(2);
        expect(turno.candidatos[0].votos).toBeGreaterThanOrEqual(turno.candidatos[1].votos);
        expect(turno.pontos.length).toBeGreaterThan(0);
        const minutos = turno.pontos.map((ponto) => ponto.minuto);
        expect(minutos).toEqual([...minutos].sort((a, b) => a - b));
        expect(minutos.every((minuto) => minuto % 5 === 0)).toBe(true);
        const ultimo = turno.pontos.at(-1).candidatos;
        for (const candidato of ultimo) expect(candidato.pct_acumulada).toBeGreaterThan(0);
      }

      const pares = corpo.pares.filter((par) => par.ano_a === 2022 && par.ano_b === 2026 && par.turno === 1);
      expect(pares.map((par) => par.posicao)).toEqual([1, 2]);
      for (const par of pares) {
        for (const curva of [par.votos_intervalo, par.pct_acumulada]) {
          if (curva.r === null) {
            expect(curva.p_valor).toBeNull();
          } else {
            expect(curva.r).toBeGreaterThanOrEqual(-1);
            expect(curva.r).toBeLessThanOrEqual(1);
            expect(curva.p_valor).toBeGreaterThan(0);
            expect(curva.p_valor).toBeLessThanOrEqual(1);
          }
        }
      }
      expect(corpo.pares.some((par) => par.ano_a === 2014 || par.ano_b === 2014)).toBe(false);

      const repetida = await app.inject({ method: 'GET', url: '/api/comparacao-anos?anos=2026,2022&uf=AC' });
      const semUf = await app.inject({ method: 'GET', url: '/api/comparacao-anos?anos=2022,2026' });
      expect(repetida.statusCode).toBe(200);
      expect(repetida.json().pares).toEqual(semUf.json().pares);
    },
    120000,
  );

  it('rejeita menos de dois anos', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/api/comparacao-anos?anos=2022' });
    expect(resposta.statusCode).toBe(400);
  });
});
