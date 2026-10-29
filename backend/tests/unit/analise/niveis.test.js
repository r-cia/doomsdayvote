import { describe, expect, it } from 'vitest';
import {
  benfordDosNiveis,
  featuresDasSecoes,
} from '../../../src/modules/analise/estatisticas.js';

function linha({ votos, secao = 's1', zona = 1, municipio = 10, votavel = 13 }) {
  return {
    nr_votavel: votavel,
    nm_votavel: `Candidato ${votavel}`,
    sg_partido: 'PT',
    secao_id: secao,
    sg_uf: 'AC',
    cd_municipio_tse: municipio,
    nr_zona: zona,
    nr_secao: 1,
    votos,
  };
}

describe('benfordDosNiveis', () => {
  it('calcula seção, zona e município com o mínimo de 10 votos', () => {
    const linhas = [
      linha({ votos: 12, secao: 's1', zona: 1 }),
      linha({ votos: 15, secao: 's2', zona: 1 }),
      linha({ votos: 8, secao: 's3', zona: 2 }),
    ];

    const { candidatos, minimo_votos } = benfordDosNiveis(linhas);

    expect(minimo_votos).toBe(10);
    expect(candidatos).toHaveLength(1);

    const niveis = candidatos[0].niveis;
    expect(niveis.secao.n).toBe(2);
    expect(niveis.zona.n).toBe(1);
    expect(niveis.municipio.n).toBe(1);
    expect(candidatos[0].secoes_abaixo_minimo).toBe(1);
    expect(candidatos[0].total_votos).toBe(35);
    expect(niveis.secao.digitos).toHaveLength(9);
  });

  it('separa candidatos e ordena por votos', () => {
    const linhas = [
      linha({ votos: 20, votavel: 13 }),
      linha({ votos: 30, votavel: 22 }),
    ];

    const { candidatos } = benfordDosNiveis(linhas);
    expect(candidatos.map((c) => c.nr_votavel)).toEqual([22, 13]);
  });
});

describe('featuresDasSecoes', () => {
  it('monta as sete features por seção', () => {
    const base = {
      sg_uf: 'AC',
      cd_municipio_tse: 10,
      nr_zona: 1,
      nr_secao: 1,
      qt_aptos: 1000,
      qt_comparecimento: 800,
      qt_abstencoes: 200,
      qt_biom: 100,
      dt_bu_recebido_ts: '2026-10-04T20:00:00.000Z',
    };

    const linhas = [
      { ...base, secao_id: 's1', nr_votavel: 13, votos: 600 },
      { ...base, secao_id: 's1', nr_votavel: 22, votos: 400 },
      {
        ...base,
        secao_id: 's2',
        nr_secao: 2,
        qt_aptos: 500,
        qt_comparecimento: 250,
        qt_abstencoes: 250,
        qt_biom: 0,
        dt_bu_recebido_ts: '2026-10-04T22:00:00.000Z',
        nr_votavel: 13,
        votos: 100,
      },
    ];

    const secoes = featuresDasSecoes(linhas);
    expect(secoes).toHaveLength(2);

    const [primeira, segunda] = secoes;
    expect(primeira.participacao).toBeCloseTo(0.8);
    expect(primeira.abstencao).toBeCloseTo(0.2);
    expect(primeira.biometria).toBeCloseTo(0.125);
    expect(primeira.share_lider).toBeCloseTo(0.6);
    expect(primeira.concentracao).toBeCloseTo(0.52);
    expect(primeira.hora).toBe(0);
    expect(primeira.tamanho).toBeCloseTo(Math.log10(1001));
    expect(segunda.hora).toBe(1);
  });

  it('descarta seções sem aptos ou sem voto nominal', () => {
    const secoes = featuresDasSecoes([
      {
        secao_id: 's1',
        sg_uf: 'AC',
        cd_municipio_tse: 10,
        nr_zona: 1,
        nr_secao: 1,
        qt_aptos: 0,
        qt_comparecimento: 0,
        qt_abstencoes: 0,
        qt_biom: 0,
        dt_bu_recebido_ts: null,
        nr_votavel: 13,
        votos: 10,
      },
    ]);
    expect(secoes).toEqual([]);
  });
});
