import { describe, expect, it } from 'vitest';
import {
  BerError,
  CODIGO_ERRO_BER,
  filhos,
  ehContexto,
  lerGeneralString,
  lerInteiro,
  lerOctetString,
  lerTlv,
} from '../../../src/modules/totalizacao/ber.js';

function capturar(executar) {
  try {
    executar();
  } catch (erro) {
    return erro;
  }
  throw new Error('nenhum erro lançado');
}

describe('leitor BER', () => {
  it('lê comprimento curto', () => {
    const buffer = Buffer.from([0x30, 0x03, 0x02, 0x01, 0x0a]);
    const sequencia = lerTlv(buffer, 0);

    expect(sequencia.classe).toBe(0);
    expect(sequencia.construido).toBe(true);
    expect(sequencia.numero).toBe(16);
    expect(sequencia.fim).toBe(5);

    const itens = filhos(buffer, sequencia);
    expect(lerInteiro(buffer, itens[0])).toBe(10);
  });

  it('lê comprimento longo de um e de dois octetos', () => {
    const comUmOcteto = Buffer.from([0x30, 0x81, 0x03, 0x02, 0x01, 0x0a]);
    expect(lerTlv(comUmOcteto, 0).fim).toBe(6);
    expect(filhos(comUmOcteto, lerTlv(comUmOcteto, 0))).toHaveLength(1);

    const comDoisOctetos = Buffer.concat([
      Buffer.from([0x30, 0x82, 0x01, 0x03]),
      Buffer.alloc(0x0103),
    ]);
    expect(lerTlv(comDoisOctetos, 0).fim).toBe(comDoisOctetos.length);
  });

  it('lê tags de contexto e valores primitivos', () => {
    const contexto = Buffer.from([0xa1, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02]);
    const tlv = lerTlv(contexto, 0);
    expect(ehContexto(tlv, 1)).toBe(true);
    const itens = filhos(contexto, tlv);

    const generalString = Buffer.from([0x1b, 0x03, 0x41, 0x42, 0x43]);
    expect(lerGeneralString(generalString, lerTlv(generalString, 0))).toBe('ABC');

    const octetos = Buffer.from([0x04, 0x02, 0xff, 0x00]);
    expect(lerOctetString(octetos, lerTlv(octetos, 0))).toEqual(Buffer.from([0xff, 0x00]));
  });

  it('rejeita truncamento com erro tipado', () => {
    const erro = capturar(() => lerTlv(Buffer.from([0x30, 0x05, 0x02, 0x01]), 0));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.TRUNCADO);
  });

  it('rejeita comprimento indeterminado e tag de número alto', () => {
    const indefinido = capturar(() => lerTlv(Buffer.from([0x30, 0x80, 0x00, 0x00]), 0));
    expect(indefinido.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);

    const numeroAlto = capturar(() => lerTlv(Buffer.from([0x1f, 0x00]), 0));
    expect(numeroAlto.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);
  });

  it('rejeita elemento que ultrapassa o contêiner', () => {
    const buffer = Buffer.from([0x30, 0x02, 0x02, 0x05]);
    const erro = capturar(() => filhos(buffer, lerTlv(buffer, 0)));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.TRUNCADO);
  });

  it('rejeita INTEGER vazio', () => {
    const buffer = Buffer.from([0x02, 0x00]);
    const erro = capturar(() => lerInteiro(buffer, lerTlv(buffer, 0)));
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);
  });
});
