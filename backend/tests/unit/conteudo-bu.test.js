import { describe, expect, it } from 'vitest';
import { hashConteudoBu, montarConteudoBu } from '../../src/modules/importacao/conteudo-bu.js';

const valores = {
  DT_ABERTURA: { precisao: 'DATA_HORA', local: '2026-10-04 08:00:00', data: null },
  DT_ENCERRAMENTO: { precisao: 'DATA_HORA', local: '2026-10-04 17:00:00', data: null },
  DT_EMISSAO_BU: { precisao: 'DATA_HORA', local: '2026-10-04 17:05:00', data: null },
  DT_BU_RECEBIDO: { precisao: 'DATA_HORA', local: '2026-10-04 17:08:44', data: null },
  DT_GERACAO: { precisao: 'DATA_HORA', local: '2026-10-04 21:00:00', data: null },
  QT_APTOS: 100,
  QT_COMPARECIMENTO: 90,
  QT_ABSTENCOES: 10,
  CD_TIPO_URNA: 1,
};

const votaveis = [
  { cd_tipo_votavel: 1, nr_votavel: 13, nm_votavel: 'A', nr_partido: 13, sg_partido: 'PT', nm_partido: 'Partido', qt_votos: 10 },
  { cd_tipo_votavel: 1, nr_votavel: 22, nm_votavel: 'B', nr_partido: 22, sg_partido: 'PL', nm_partido: 'Partido 2', qt_votos: 5 },
];

describe('conteudo do BU', () => {
  it('é estável à ordem dos votáveis', () => {
    const a = hashConteudoBu(montarConteudoBu({ valores, votaveis }));
    const b = hashConteudoBu(montarConteudoBu({ valores, votaveis: [...votaveis].reverse() }));
    expect(a).toBe(b);
  });

  it('muda quando QT_VOTOS muda', () => {
    const a = hashConteudoBu(montarConteudoBu({ valores, votaveis }));
    const alterado = [{ ...votaveis[0], qt_votos: 11 }, votaveis[1]];
    const b = hashConteudoBu(montarConteudoBu({ valores, votaveis: alterado }));
    expect(a).not.toBe(b);
  });

  it('ignora DT_GERACAO', () => {
    const a = hashConteudoBu(montarConteudoBu({ valores, votaveis }));
    const comOutraGeracao = {
      ...valores,
      DT_GERACAO: { precisao: 'DATA_HORA', local: '2026-10-05 10:00:00', data: null },
    };
    const b = hashConteudoBu(montarConteudoBu({ valores: comOutraGeracao, votaveis }));
    expect(a).toBe(b);
  });
});
