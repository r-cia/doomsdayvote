import { describe, expect, it } from 'vitest';
import { parsearLogJez } from '../../../src/modules/totalizacao/log.js';
import {
  biometriaPorFaixa,
  incidentesDaSessao,
  parearEleitores,
  tempoDeVoto,
} from '../../../src/modules/totalizacao/metricas.js';
import { CENARIO, gerarLogJez } from '../../helpers/dados-sinteticos.js';

const eventos = parsearLogJez(gerarLogJez());

describe('métricas da sessão de votação', () => {
  it('pareia cada eleitor habilitado com o voto computado seguinte', () => {
    const eleitores = parearEleitores(eventos);
    expect(eleitores).toHaveLength(CENARIO.comparecimento);

    for (const eleitor of eleitores) {
      expect(eleitor.duracaoMs).toBeGreaterThan(0);
      expect(Date.parse(eleitor.computadoEm)).toBeGreaterThan(Date.parse(eleitor.habilitadoEm));
      expect(eleitor.habilitadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(typeof eleitor.correcao).toBe('boolean');
      expect(Number.isInteger(eleitor.qt_falhas_biometria)).toBe(true);
      expect(Number.isInteger(eleitor.qt_teclas_indevidas)).toBe(true);
      expect([1, 2, 3]).toContain(eleitor.tp_habilitacao);
    }
  });

  it('resume o tempo de voto dos três eleitores', () => {
    expect(tempoDeVoto(eventos)).toEqual({
      quantidade: 3,
      mediaMs: 20000,
      medianaMs: 20000,
      maisRapidoMs: 10000,
      maisDemoradoMs: 30000,
    });
  });

  it('classifica a biometria por quantidade de falhas', () => {
    const faixas = biometriaPorFaixa(eventos);
    expect(faixas).toEqual({
      falhou1: 1,
      falhou2: 1,
      falhou3: 0,
      falhou4: 0,
      manual: 0,
    });
  });

  it('lista os incidentes da sessão', () => {
    const incidentes = incidentesDaSessao(eventos);
    expect(incidentes).toHaveLength(1);

    for (const incidente of incidentes) {
      expect(incidente.nivel).not.toBe('INFO');
      expect(incidente).toEqual({
        instante: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
        nivel: incidente.nivel,
        tipo: incidente.tipo,
        textoOriginal: incidente.textoOriginal,
      });
    }
  });
});
