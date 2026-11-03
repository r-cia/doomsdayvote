import { describe, expect, it } from 'vitest';
import { decodificarBu } from '../../../src/modules/totalizacao/bu.js';
import { decodificarRdv } from '../../../src/modules/totalizacao/rdv.js';
import {
  conferirBuRdv,
  votosDoBu,
} from '../../../src/modules/totalizacao/conferencia-rdv.js';
import {
  CENARIO,
  gerarBu,
  gerarRdv,
  votosDoCenario,
} from '../../helpers/dados-sinteticos.js';

const bu = decodificarBu(gerarBu());
const rdvVotos = decodificarRdv(gerarRdv({ votos: votosDoCenario() })).map((voto) => ({
  cd_cargo_pergunta: voto.cargo,
  cd_tipo_votavel: voto.tipo,
  nr_votavel: voto.numero,
  qt_votos: voto.quantidade,
}));

const LOCALIZACAO = {
  sg_uf: CENARIO.uf,
  cd_municipio_tse: CENARIO.municipio,
  nr_zona: CENARIO.zona,
  nr_secao: CENARIO.secao,
};

function conferir(buVotos) {
  return conferirBuRdv({
    buVotos,
    rdvVotos,
    sgUf: LOCALIZACAO.sg_uf,
    cdMunicipioTse: LOCALIZACAO.cd_municipio_tse,
    nrZona: LOCALIZACAO.nr_zona,
    nrSecao: LOCALIZACAO.nr_secao,
  });
}

describe('conferência BU × RDV', () => {
  it('não diverge quando as duas fontes vêm do mesmo prefixo', () => {
    expect(conferir(votosDoBu(bu))).toEqual([]);
  });

  it('sinaliza a quantidade adulterada de um votável do BU', () => {
    const votos = votosDoBu(bu);
    const alvo = votos.find(
      (voto) => voto.cd_cargo_pergunta === 1 && voto.nr_votavel === 13,
    );
    alvo.qt_votos = 2;

    expect(conferir(votos)).toEqual([
      {
        fonte: 'rdv',
        campo: 'votos',
        ...LOCALIZACAO,
        cd_cargo_pergunta: 1,
        nr_votavel: 13,
        valor_esperado: '2',
        valor_encontrado: '1',
      },
    ]);
  });

  it('sinaliza votável ausente no BU com encontrado zero', () => {
    const votos = votosDoBu(bu).filter(
      (voto) => !(voto.cd_cargo_pergunta === 1 && voto.nr_votavel === 13),
    );

    expect(conferir(votos)).toEqual([
      {
        fonte: 'rdv',
        campo: 'votos',
        ...LOCALIZACAO,
        cd_cargo_pergunta: 1,
        nr_votavel: 13,
        valor_esperado: '0',
        valor_encontrado: '1',
      },
    ]);
  });
});
