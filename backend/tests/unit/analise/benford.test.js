import { describe, expect, it } from 'vitest';
import {
  ESPERADO_BENFORD,
  SIMULACOES_BENFORD,
  calcularBenford,
  classificarMad,
  primeiroDigito,
} from '../../../src/modules/analise/benford.js';

function valoresComDigito(digito, quantidade) {
  return Array.from({ length: quantidade }, (_, indice) =>
    Number(`${digito}${String(indice).padStart(3, '0')}`),
  );
}

describe('primeiroDigito', () => {
  it('extrai o primeiro dígito de inteiros positivos', () => {
    expect(primeiroDigito(1)).toBe(1);
    expect(primeiroDigito(9)).toBe(9);
    expect(primeiroDigito(10)).toBe(1);
    expect(primeiroDigito(99)).toBe(9);
    expect(primeiroDigito(1234)).toBe(1);
    expect(primeiroDigito(-57)).toBe(5);
  });

  it('ignora zero, negativos fracionários e valores inválidos', () => {
    expect(primeiroDigito(0)).toBeNull();
    expect(primeiroDigito(0.4)).toBeNull();
    expect(primeiroDigito(null)).toBeNull();
    expect(primeiroDigito('abc')).toBeNull();
  });
});

describe('classificarMad', () => {
  it('usa os limites de Nigrini para o primeiro dígito', () => {
    expect(classificarMad(0.0059)).toBe('conformidade próxima');
    expect(classificarMad(0.006)).toBe('conformidade aceitável');
    expect(classificarMad(0.0119)).toBe('conformidade aceitável');
    expect(classificarMad(0.012)).toBe('conformidade marginal');
    expect(classificarMad(0.015)).toBe('não conformidade');
    expect(classificarMad(0.2)).toBe('não conformidade');
    expect(classificarMad(null)).toBeNull();
  });
});

describe('calcularBenford', () => {
  it('reconhece uma distribuição aderente à lei', () => {
    const quantidades = [301, 176, 125, 97, 79, 67, 58, 51, 46];
    const valores = quantidades.flatMap((quantidade, indice) =>
      valoresComDigito(indice + 1, quantidade),
    );

    const resultado = calcularBenford(valores);

    expect(resultado.n).toBe(1000);
    expect(resultado.digitos).toHaveLength(9);
    expect(resultado.mad).toBeLessThan(0.0005);
    expect(resultado.classificacao).toBe('conformidade próxima');
    expect(resultado.digitos[0].esperado_percentual).toBeCloseTo(30.103, 2);
    expect(resultado.monte_carlo.simulacoes).toBe(SIMULACOES_BENFORD);
    expect(resultado.monte_carlo.p_valor).toBeGreaterThan(0);
    expect(resultado.monte_carlo.p_valor).toBeLessThanOrEqual(1);
  });

  it('reconhece uma distribuição uniforme como não conformidade', () => {
    const valores = Array.from({ length: 9 }, (_, indice) =>
      valoresComDigito(indice + 1, 100),
    ).flat();

    const resultado = calcularBenford(valores);

    expect(resultado.n).toBe(900);
    expect(resultado.mad).toBeGreaterThan(0.015);
    expect(resultado.classificacao).toBe('não conformidade');
    expect(resultado.monte_carlo.p_valor).toBeLessThan(0.01);
  });

  it('devolve n zero quando não há contagens válidas', () => {
    const resultado = calcularBenford([]);

    expect(resultado.n).toBe(0);
    expect(resultado.mad).toBeNull();
    expect(resultado.classificacao).toBeNull();
    expect(resultado.monte_carlo.p_valor).toBeNull();
    expect(resultado.digitos.map((digito) => digito.observado)).toEqual(
      Array(9).fill(0),
    );
  });

  it('mantém a distribuição esperada somando 100%', () => {
    const soma = ESPERADO_BENFORD.reduce((total, valor) => total + valor, 0);
    expect(soma).toBeCloseTo(1, 10);
  });

  it('devolve a faixa de 95% por dígito, em percentual, determinística e ordenada', () => {
    const valores = Array.from({ length: 300 }, (_, indice) => 10 + indice);
    const { monte_carlo: primeira, digitos } = calcularBenford(valores);
    const { monte_carlo: segunda } = calcularBenford(valores);

    expect(primeira.faixa_digitos).toEqual(segunda.faixa_digitos);
    expect(primeira.faixa_digitos.map((faixa) => faixa.digito)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    primeira.faixa_digitos.forEach((faixa, indice) => {
      expect(faixa.p025).toBeLessThan(faixa.p975);
      expect(faixa.p025).toBeLessThan(digitos[indice].esperado_percentual);
      expect(faixa.p975).toBeGreaterThan(digitos[indice].esperado_percentual);
      expect(faixa.p025).toBeGreaterThanOrEqual(0);
      expect(faixa.p975).toBeLessThanOrEqual(100);
    });
  });

  it('a faixa estreita quando n cresce', () => {
    const faixa = (n) => calcularBenford(Array.from({ length: n }, (_, indice) => 10 + indice)).monte_carlo.faixa_digitos[0];
    const pequena = faixa(100);
    const grande = faixa(2000);
    expect(grande.p975 - grande.p025).toBeLessThan(pequena.p975 - pequena.p025);
  });

  it('não há faixa quando n é zero', () => {
    expect(calcularBenford([]).monte_carlo.faixa_digitos).toBeNull();
  });

  it('reproduz o mesmo p-valor para o mesmo n e distribuição', () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(calcularBenford(valores).monte_carlo).toEqual(
      calcularBenford(valores).monte_carlo,
    );
  });
});
