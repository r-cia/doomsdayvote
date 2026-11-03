import { describe, expect, it } from 'vitest';
import { BerError, CODIGO_ERRO_BER } from '../../../src/modules/totalizacao/ber.js';
import { decodificarBu } from '../../../src/modules/totalizacao/bu.js';
import { conferirBuRdv, votosDoBu } from '../../../src/modules/totalizacao/conferencia-rdv.js';
import { decodificarRdv } from '../../../src/modules/totalizacao/rdv.js';
import { extrairEntrada, listarEntradas } from '../../../src/modules/totalizacao/zip.js';
import {
  CENARIO,
  gerarBu,
  gerarRdv,
  gerarZip,
  votosDoCenario,
} from '../../helpers/dados-sinteticos.js';

const PREFIXO = 'secao-sintetica';
const conteudo = gerarRdv({ votos: votosDoCenario() });
const bu = decodificarBu(gerarBu());

function capturar(executar) {
  try {
    executar();
  } catch (erro) {
    return erro;
  }
  throw new Error('nenhum erro lançado');
}

function somarPor(votos, chave) {
  const totais = new Map();
  for (const voto of votos) {
    const identificador = chave(voto);
    totais.set(identificador, (totais.get(identificador) ?? 0) + voto.quantidade);
  }
  return totais;
}

const votosBu = bu.cargos.flatMap((cargo) =>
  cargo.votaveis.map((votavel) => ({
    cargo: cargo.identificador,
    tipo: votavel.tipo,
    numero: votavel.numero,
    quantidade: votavel.quantidade,
  })),
);

describe('decoder do rdv.dat', () => {
  const votos = decodificarRdv(conteudo);

  it('agrega por cargo, tipo e número sem votos individuais', () => {
    expect(votos.length).toBeGreaterThan(0);
    expect(votos.every((voto) => voto.quantidade > 0)).toBe(true);

    const chaves = votos.map((voto) => `${voto.cargo}:${voto.tipo}:${voto.numero ?? 'nulo'}`);
    expect(new Set(chaves).size).toBe(chaves.length);

    for (const voto of votos) {
      expect(Object.keys(voto).sort()).toEqual(['cargo', 'numero', 'quantidade', 'tipo']);
    }
  });

  it('bate com o total de votos de cada cargo do BU', () => {
    expect(somarPor(votos, (voto) => voto.cargo)).toEqual(
      somarPor(votosBu, (voto) => voto.cargo),
    );
    expect(somarPor(votos, (voto) => voto.cargo)).toEqual(
      new Map([
        [1, CENARIO.comparecimento],
        [3, CENARIO.comparecimento],
      ]),
    );
  });

  it('bate com o total de cada cargo e tipo de votável do BU', () => {
    expect(somarPor(votos, (voto) => `${voto.cargo}:${voto.tipo}`)).toEqual(
      somarPor(votosBu, (voto) => `${voto.cargo}:${voto.tipo}`),
    );
  });

  it('reproduz exatamente os votos nominais do BU', () => {
    expect(votos.filter((voto) => voto.tipo === 1)).toEqual(
      votosBu.filter((voto) => voto.tipo === 1),
    );
  });

  it('devolve erro tipado para arquivo truncado', () => {
    const erro = capturar(() => decodificarRdv(conteudo.subarray(0, conteudo.length - 10)));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.TRUNCADO);
  });

  it('devolve erro tipado para arquivo fora do formato BER esperado', () => {
    const alterado = Buffer.from(conteudo);
    alterado[0] = 0x31;
    const erro = capturar(() => decodificarRdv(alterado));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);
  });
});

function conferir(conteudoRdv, buConferido) {
  const votosRdv = decodificarRdv(conteudoRdv).map((voto) => ({
    cd_cargo_pergunta: voto.cargo,
    cd_tipo_votavel: voto.tipo,
    nr_votavel: voto.numero,
    qt_votos: voto.quantidade,
  }));

  return conferirBuRdv({
    buVotos: votosDoBu(buConferido),
    rdvVotos: votosRdv,
    sgUf: CENARIO.uf,
    cdMunicipioTse: buConferido.localidade.municipio,
    nrZona: buConferido.localidade.zona,
    nrSecao: buConferido.localidade.secao,
  });
}

function trocarTipo(origem, de, para) {
  const alterado = Buffer.from(origem);
  const indice = alterado.indexOf(Buffer.from([0x0a, 0x01, de]));
  if (indice < 0) throw new Error(`tipo ${de} ausente na fixture sintética`);
  alterado[indice + 2] = para;
  return alterado;
}

describe('tipo de voto 6 do rdv.dat', () => {
  const comSeis = trocarTipo(conteudo, 4, 6);

  it('reconhece o código 6 no mesmo tipo 3 do código 4', () => {
    expect(conteudo.includes(Buffer.from([0x0a, 0x01, 0x06]))).toBe(false);
    expect(decodificarRdv(comSeis)).toEqual(decodificarRdv(conteudo));
  });

  it('mantém a conferência BU × RDV fechada na seção sintética', () => {
    expect(decodificarRdv(conteudo).filter((voto) => voto.tipo === 3).length).toBeGreaterThan(0);
    expect(conferir(conteudo, bu)).toEqual([]);
    expect(conferir(comSeis, bu)).toEqual([]);
  });

  it('devolve erro tipado para código ainda desconhecido', () => {
    const erro = capturar(() => decodificarRdv(trocarTipo(conteudo, 4, 9)));
    expect(erro).toBeInstanceOf(BerError);
    expect(erro.codigo).toBe(CODIGO_ERRO_BER.INVALIDO);
    expect(erro.message).toBe('tipo de voto desconhecido: 9');
  });
});

describe('rdv.dat empacotado em zip sintético', () => {
  it('fecha a conferência BU × RDV na seção do zip', () => {
    const zip = gerarZip([
      [`${PREFIXO}-bu.dat`, gerarBu()],
      [`${PREFIXO}-rdv.dat`, conteudo],
    ]);
    const porNome = new Map(
      listarEntradas(zip, 'arquivo zip').map((entrada) => [entrada.nome, entrada]),
    );
    const conteudoRdv = extrairEntrada(zip, porNome.get(`${PREFIXO}-rdv.dat`), 'arquivo zip');
    const conteudoBu = extrairEntrada(zip, porNome.get(`${PREFIXO}-bu.dat`), 'arquivo zip');

    expect(conteudoRdv.includes(Buffer.from([0x0a, 0x01, 0x06]))).toBe(false);
    expect(conferir(conteudoRdv, decodificarBu(conteudoBu))).toEqual([]);
  });
});
