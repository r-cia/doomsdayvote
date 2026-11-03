import { describe, expect, it } from 'vitest';
import { agruparSecoes } from '../../../src/modules/analise/comparacao-local.js';

function secao({ id, zona = 1, numero = 1, municipio = 10, local = 100, aptos = 100, comparecimento = 80, abstencoes = 20, candidatos = [{ nr_votavel: 13, nm_votavel: 'A', sg_partido: 'PT', qt_votos: 50 }] }) {
  return {
    id,
    sg_uf: 'AC',
    cd_municipio_tse: municipio,
    nm_municipio: 'Cidade',
    nr_zona: zona,
    nr_secao: numero,
    nr_local_votacao: local,
    qt_aptos: aptos,
    qt_comparecimento: comparecimento,
    qt_abstencoes: abstencoes,
    candidatos,
  };
}

describe('agruparSecoes', () => {
  it('agrupa por local de votação quando há amostra suficiente', () => {
    const secoes = Array.from({ length: 6 }, (_, i) =>
      secao({ id: `s${i}`, numero: i + 1, local: 100 }),
    );
    const resultado = agruparSecoes(secoes, { minimoGrupo: 5 });
    expect(resultado.grupos).toHaveLength(1);
    expect(resultado.grupos[0].nivel).toBe('local');
    expect(resultado.grupos[0].tamanho).toBe(6);
    expect(resultado.grupos[0].estado).toBe('ok');
    expect(resultado.grupos[0].secoes[0].metricas.participacao).toBeCloseTo(0.8);
    expect(resultado.grupos[0].secoes[0].distancia_pp.participacao).toBeDefined();
  });

  it('faz fallback para zona e depois município', () => {
    const secoes = [
      secao({ id: 's1', local: 1, numero: 1, aptos: 100 }),
      secao({ id: 's2', local: 2, numero: 2, aptos: 100 }),
    ];
    const resultado = agruparSecoes(secoes, { minimoGrupo: 5 });
    expect(resultado.grupos[0].nivel).toBe('municipio');
    expect(resultado.grupos[0].dados_insuficientes).toBe(true);
    expect(resultado.grupos[0].estado).toBe('dados_insuficientes');
  });

  it('aplica controle de escala por aptos', () => {
    const secoes = [
      ...Array.from({ length: 5 }, (_, i) => secao({ id: `a${i}`, aptos: 100, numero: i + 1 })),
      secao({ id: 'b1', aptos: 1000, numero: 99 }),
    ];
    const resultado = agruparSecoes(secoes, { minimoGrupo: 5 });
    const grupo = resultado.grupos[0];
    expect(grupo.tamanho).toBe(5);
  });

  it('marca ausência como null e não como zero', () => {
    const secoes = Array.from({ length: 5 }, (_, i) =>
      secao({ id: `s${i}`, aptos: null, comparecimento: null, abstencoes: null, numero: i + 1 }),
    );
    const resultado = agruparSecoes(secoes, { minimoGrupo: 5 });
    const item = resultado.grupos[0].secoes[0];
    expect(item.metricas.participacao).toBeNull();
    expect(item.metricas.abstencao).toBeNull();
  });
});