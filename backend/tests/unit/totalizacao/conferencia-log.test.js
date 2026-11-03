import { describe, expect, it } from 'vitest';
import { decodificarBu } from '../../../src/modules/totalizacao/bu.js';
import { parsearLogJez, TIPO_EVENTO } from '../../../src/modules/totalizacao/log.js';
import { conferirBuLog } from '../../../src/modules/totalizacao/conferencia-log.js';
import { CENARIO, gerarBu, gerarLogJez } from '../../helpers/dados-sinteticos.js';

const bu = decodificarBu(gerarBu());
const eventos = parsearLogJez(gerarLogJez());

const LOCALIZACAO = {
  sg_uf: CENARIO.uf,
  cd_municipio_tse: CENARIO.municipio,
  nr_zona: CENARIO.zona,
  nr_secao: CENARIO.secao,
};

function conferir(buConferido, eventosConferidos = eventos) {
  return conferirBuLog({
    bu: buConferido,
    eventos: eventosConferidos,
    sgUf: LOCALIZACAO.sg_uf,
    cdMunicipioTse: LOCALIZACAO.cd_municipio_tse,
    nrZona: LOCALIZACAO.nr_zona,
    nrSecao: LOCALIZACAO.nr_secao,
  });
}

describe('conferência BU × log', () => {
  it('não diverge com o BU e o log do mesmo prefixo', () => {
    expect(conferir(bu)).toEqual([]);
  });

  it('sinaliza comparecimento adulterado', () => {
    expect(conferir({ ...bu, comparecimento: 4 })).toEqual([
      {
        fonte: 'log',
        campo: 'comparecimento',
        ...LOCALIZACAO,
        valor_esperado: '4',
        valor_encontrado: '3',
      },
    ]);
  });

  it('sinaliza abertura deslocada em um segundo', () => {
    expect(conferir({ ...bu, abertura: '20261004T070002' })).toEqual([
      {
        fonte: 'log',
        campo: 'abertura',
        ...LOCALIZACAO,
        valor_esperado: '2026-10-04T07:00:02',
        valor_encontrado: '2026-10-04T07:00:01',
      },
    ]);
  });

  it('sinaliza biometria adulterada', () => {
    expect(conferir({ ...bu, habilitacao2: 4 })).toEqual([
      {
        fonte: 'log',
        campo: 'biometria',
        ...LOCALIZACAO,
        valor_esperado: '4',
        valor_encontrado: '3',
      },
    ]);
  });

  it('sinaliza encerramento ausente no log', () => {
    const semEncerramento = eventos.filter(
      (evento) => evento.tipo !== TIPO_EVENTO.ENCERRAMENTO,
    );

    expect(conferir(bu, semEncerramento)).toEqual([
      {
        fonte: 'log',
        campo: 'encerramento',
        ...LOCALIZACAO,
        valor_esperado: '2026-10-04T17:00:00',
        valor_encontrado: 'ausente',
      },
    ]);
  });
});
