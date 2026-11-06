import { describe, expect, it } from 'vitest';
import { BerError, CODIGO_ERRO_BER } from '../../../src/modules/totalizacao/ber.js';
import { decodificarBu } from '../../../src/modules/totalizacao/bu.js';
import { CENARIO, gerarBu } from '../../helpers/dados-sinteticos.js';

const conteudo = gerarBu();

function capturar(executar) {
  try {
    executar();
  } catch (erro) {
    return erro;
  }
  throw new Error('nenhum erro lançado');
}

const CORRESPONDENCIA = {
  1: { nome: 'Presidente', votos: 3, votaveis: 3 },
  3: { nome: 'Governador', votos: 3, votaveis: 3 },
};

describe('decoder do bu.dat', () => {
  const bu = decodificarBu(conteudo);

  it('decodifica cabeçalho, urna e localidade', () => {
    expect(bu.dataHoraArquivo).toBe('20261004T171000');
    expect(bu.urna).toBe(999999);
    expect(bu.localidade).toEqual({
      municipio: 9999,
      zona: 101,
      local: 9001,
      secao: 1,
    });
    expect(bu.abertura).toBe('20261004T070001');
    expect(bu.encerramento).toBe('20261004T170000');
    expect(bu.comparecimento).toBe(3);
  });

  it('expõe as três habilitações separadamente', () => {
    expect(bu.habilitacao1).toBe(3);
    expect(bu.habilitacao2).toBe(3);
    expect(bu.habilitacao3).toBe(0);
  });

  it('decodifica BU sem bloco de habilitações (seções do exterior)', () => {
    const semHabilitacoes = decodificarBu(gerarBu({ habilitacoes: null }));
    expect(semHabilitacoes.habilitacao1).toBeNull();
    expect(semHabilitacoes.habilitacao2).toBeNull();
    expect(semHabilitacoes.habilitacao3).toBeNull();
    expect(semHabilitacoes.cargos.map((cargo) => cargo.identificador)).toEqual([1, 3]);
    expect(semHabilitacoes.comparecimento).toBe(3);
  });

  it('achata os cargos internos com o identificador do próprio cargo', () => {
    expect(bu.cargos.map((cargo) => cargo.identificador)).toEqual([1, 3]);
    expect(
      bu.cargos.map((cargo) => CORRESPONDENCIA[cargo.identificador].nome),
    ).toEqual(['Presidente', 'Governador']);

    for (const cargo of bu.cargos) {
      const esperado = CORRESPONDENCIA[cargo.identificador];
      if (!esperado) throw new Error(`cargo ${cargo.identificador} sem correspondência no BWEB`);

      expect(cargo.aptos).toBe(CENARIO.aptos);
      expect(cargo.comparecimento).toBe(CENARIO.comparecimento);
      expect(cargo.votaveis).toHaveLength(esperado.votaveis);
      expect(cargo.votaveis.reduce((total, votavel) => total + votavel.quantidade, 0)).toBe(
        esperado.votos,
      );

      const chaves = cargo.votaveis.map((votavel) => `${votavel.tipo}:${votavel.numero ?? 'nulo'}`);
      expect(new Set(chaves).size).toBe(chaves.length);
    }
  });

  it('usa o número do votável codificado no segundo inteiro do cont[3]', () => {
    const porIdentificador = new Map(bu.cargos.map((cargo) => [cargo.identificador, cargo]));

    expect(porIdentificador.get(1).votaveis).toEqual(
      expect.arrayContaining([
        { tipo: 1, numero: 13, quantidade: 1 },
        { tipo: 1, numero: 22, quantidade: 1 },
        { tipo: 3, numero: null, quantidade: 1 },
      ]),
    );

    expect(porIdentificador.get(3).votaveis).toEqual(
      expect.arrayContaining([
        { tipo: 1, numero: 10, quantidade: 1 },
        { tipo: 1, numero: 22, quantidade: 1 },
        { tipo: 3, numero: null, quantidade: 1 },
      ]),
    );
  });

  it('devolve erro tipado para arquivo truncado', () => {
    const erro = capturar(() => decodificarBu(conteudo.subarray(0, conteudo.length - 10)));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.TRUNCADO);
  });

  it('devolve erro tipado para arquivo fora do formato BER esperado', () => {
    const alterado = Buffer.from(conteudo);
    alterado[0] = 0x31;
    const erro = capturar(() => decodificarBu(alterado));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);
  });
});
