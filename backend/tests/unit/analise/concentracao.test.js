import { describe, expect, it } from 'vitest';
import { concentracaoPura, agruparPorFaixaAptos } from '../../../src/modules/analise/concentracao.js';

function secao({ id, zona = 1, numero = 1, municipio = 10, local = 100, aptos = 100, candidatos = [{ nr_votavel: 13, nm_votavel: 'A', sg_partido: 'PT', qt_votos: 50 }, { nr_votavel: 22, nm_votavel: 'B', sg_partido: 'PSDB', qt_votos: 30 }] }) {
  return {
    id,
    sg_uf: 'AC',
    cd_municipio_tse: municipio,
    nm_municipio: 'Cidade',
    nr_zona: zona,
    nr_secao: numero,
    nr_local_votacao: local,
    qt_aptos: aptos,
    candidatos,
  };
}

describe('concentracaoPura', () => {
  it('calcula share do líder e margem para o segundo', () => {
    const secoes = Array.from({ length: 6 }, (_, i) =>
      secao({ id: `s${i}`, numero: i + 1, local: 100, candidatos: [{ nr_votavel: 13, nm_votavel: 'A', sg_partido: 'PT', qt_votos: 60 }, { nr_votavel: 22, nm_votavel: 'B', sg_partido: 'PSDB', qt_votos: 20 }] }),
    );
    const resultado = concentracaoPura(secoes);
    expect(resultado.secoes).toHaveLength(6);
    const item = resultado.secoes[0];
    expect(item.share_lider).toBeCloseTo(0.75);
    expect(item.margem_absoluta).toBe(40);
    expect(item.contexto.estado).toBe('ok');
    expect(resultado.top_share).toHaveLength(6);
  });

  it('marca ausência como null', () => {
    const secoes = Array.from({ length: 5 }, (_, i) =>
      secao({ id: `s${i}`, numero: i + 1, candidatos: [{ nr_votavel: 13, nm_votavel: 'A', sg_partido: 'PT', qt_votos: 10 }] }),
    );
    const resultado = concentracaoPura(secoes);
    const item = resultado.secoes[0];
    expect(item.segundo).toBeNull();
    expect(item.margem_absoluta).toBeNull();
  });
});

describe('agruparPorFaixaAptos', () => {
  it('cria faixas por aptos', () => {
    const secoes = [
      secao({ id: 'a', aptos: 100 }),
      secao({ id: 'b', aptos: 200 }),
    ];
    const bandas = agruparPorFaixaAptos(secoes, { bandas: 2, minimoGrupo: 1 });
    expect(Array.isArray(bandas)).toBe(true);
    expect(bandas.length).toBeGreaterThan(0);
  });
});