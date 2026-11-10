import { describe, expect, it } from 'vitest';
import { decodificarBu } from '../../../src/modules/totalizacao/bu.js';
import { parsearLogJez, TIPO_EVENTO } from '../../../src/modules/totalizacao/log.js';
import { conferirBuLog, janelaDoBu } from '../../../src/modules/totalizacao/conferencia-log.js';
import { parearEleitores } from '../../../src/modules/totalizacao/metricas.js';
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

  it('isola o turno do BU num log que traz o turno anterior e conta o que ficou fora', () => {
    const turnoAnterior = [
      { tipo: TIPO_EVENTO.URNA_PRONTA, instante: '2026-09-27T07:00:01' },
      { tipo: TIPO_EVENTO.ELEITOR_HABILITADO, instante: '2026-09-27T07:00:10' },
      { tipo: TIPO_EVENTO.VOTO_COMPUTADO, instante: '2026-09-27T07:00:40' },
      { tipo: TIPO_EVENTO.ELEITOR_HABILITADO, instante: '2026-09-27T16:59:00' },
      { tipo: TIPO_EVENTO.ENCERRAMENTO, instante: '2026-09-27T17:00:00' },
    ];
    const janela = janelaDoBu([...turnoAnterior, ...eventos], bu);

    expect(janela).toMatchObject({
      identificada: true,
      fora: 5,
      votosFora: 1,
      primeiroFora: '2026-09-27T07:00:01',
      ultimoFora: '2026-09-27T17:00:00',
    });
    expect(janela.eventos).toEqual(eventos);
    expect(conferir(bu, janela.eventos)).toEqual([]);
    expect(parearEleitores(janela.eventos)).toHaveLength(CENARIO.comparecimento);
  });

  it('não filtra nada quando o log não coincide exatamente com a abertura do BU', () => {
    const janela = janelaDoBu(eventos, { ...bu, abertura: '20261004T070002' });

    expect(janela).toMatchObject({ identificada: false, fora: 0, votosFora: 0 });
    expect(janela.eventos).toBe(eventos);
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
