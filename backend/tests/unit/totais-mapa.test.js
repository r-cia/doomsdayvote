import { describe, expect, it } from 'vitest';
import { areasComDeltaEntreCortes, codigoIbgeUf } from '../../src/modules/apuracao/totais.js';

describe('codigoIbgeUf', () => {
  it('devolve o código IBGE da UF independente de caixa e espaços', () => {
    expect(codigoIbgeUf('SP')).toBe('35');
    expect(codigoIbgeUf(' ac ')).toBe('12');
    expect(codigoIbgeUf('DF')).toBe('53');
  });

  it('devolve null para UF desconhecida ou ausente', () => {
    expect(codigoIbgeUf('ZZ')).toBeNull();
    expect(codigoIbgeUf(null)).toBeNull();
    expect(codigoIbgeUf(undefined)).toBeNull();
  });
});

describe('areasComDeltaEntreCortes', () => {
  const votosCandidatos = [
    { nr_votavel: 13, nm_votavel: 'Candidato A' },
    { nr_votavel: 22, nm_votavel: 'Candidato B' },
  ];

  it('calcula o delta por candidato no nível UF', () => {
    const [area] = areasComDeltaEntreCortes({
      areas: [
        {
          sg_uf: 'AC',
          lider: { nr_votavel: 13, qt_votos: 120, percentual: 60 },
          candidatos: [{ nr_votavel: 13, qt_votos: 120, percentual: 60 }],
        },
      ],
      areasAnteriores: [
        {
          sg_uf: 'AC',
          candidatos: [{ nr_votavel: 13, qt_votos: 100, percentual: 55 }],
        },
      ],
      nivel: 'uf',
      candidatoSelecionado: 13,
      votosCandidatos,
    });

    expect(area.lider_nome).toBe('Candidato A');
    expect(area.candidato_votos).toBe(120);
    expect(area.candidatos[0].qt_votos_delta).toBe(20);
  });

  it('usa o código do município como chave no nível município', () => {
    const [area] = areasComDeltaEntreCortes({
      areas: [
        {
          cd_municipio_tse: 50308,
          lider: { nr_votavel: 22, qt_votos: 40, percentual: 40 },
          candidatos: [{ nr_votavel: 22, qt_votos: 40, percentual: 40 }],
        },
      ],
      areasAnteriores: [
        {
          cd_municipio_tse: 50308,
          candidatos: [{ nr_votavel: 22, qt_votos: 50, percentual: 50 }],
        },
      ],
      nivel: 'municipio',
      candidatoSelecionado: 22,
      votosCandidatos,
    });

    expect(area.lider_nome).toBe('Candidato B');
    expect(area.candidato_percentual).toBe(40);
    expect(area.candidatos[0].qt_votos_delta).toBe(0);
  });

  it('mantém nulos quando não há corte anterior nem candidato selecionado', () => {
    const [area] = areasComDeltaEntreCortes({
      areas: [{ sg_uf: 'RJ', lider: null, candidatos: [] }],
      areasAnteriores: null,
      nivel: 'uf',
      candidatoSelecionado: 13,
      votosCandidatos,
    });

    expect(area.lider_nome).toBeNull();
    expect(area.candidato_votos).toBeNull();
    expect(area.candidato_percentual).toBeNull();
  });
});
