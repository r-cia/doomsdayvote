import { describe, expect, it } from 'vitest';
import {
  ESPERADO_BENFORD,
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
  });

  it('reconhece uma distribuição uniforme como não conformidade', () => {
    const valores = Array.from({ length: 9 }, (_, indice) =>
      valoresComDigito(indice + 1, 100),
    ).flat();

    const resultado = calcularBenford(valores);

    expect(resultado.n).toBe(900);
    expect(resultado.mad).toBeGreaterThan(0.015);
    expect(resultado.classificacao).toBe('não conformidade');
  });

  it('devolve n zero quando não há contagens válidas', () => {
    const resultado = calcularBenford([]);

    expect(resultado.n).toBe(0);
    expect(resultado.mad).toBeNull();
    expect(resultado.classificacao).toBeNull();
    expect(resultado.digitos.map((digito) => digito.observado)).toEqual(
      Array(9).fill(0),
    );
  });

  it('mantém a distribuição esperada somando 100%', () => {
    const soma = ESPERADO_BENFORD.reduce((total, valor) => total + valor, 0);
    expect(soma).toBeCloseTo(1, 10);
  });
});
