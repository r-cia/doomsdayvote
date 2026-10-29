import { describe, expect, it } from 'vitest';
import { encodingSuspeito, validarRegistros } from '../../src/modules/importacao/validacoes.js';

function dataHora(local) {
  return { precisao: 'DATA_HORA', local, data: null };
}

function registro(over = {}) {
  const valores = {
    ANO_ELEICAO: 2026,
    CD_PLEITO: 1,
    CD_ELEICAO: 2,
    NR_TURNO: 1,
    SG_UF: 'AC',
    CD_MUNICIPIO: 1392,
    NR_ZONA: 1,
    NR_SECAO: 1,
    CD_CARGO_PERGUNTA: 1,
    DS_CARGO_PERGUNTA: 'Presidente',
    CD_TIPO_VOTAVEL: 1,
    NR_VOTAVEL: 13,
    QT_VOTOS: 90,
    QT_APTOS: 100,
    QT_COMPARECIMENTO: 90,
    QT_ABSTENCOES: 10,
    DT_ABERTURA: dataHora('2026-10-04 08:00:00'),
    DT_ENCERRAMENTO: dataHora('2026-10-04 17:00:00'),
    DT_EMISSAO_BU: dataHora('2026-10-04 17:05:00'),
    DT_BU_RECEBIDO: dataHora('2026-10-04 17:08:44'),
    ...(over.valores ?? {}),
  };

  return { nrLinha: 2, bruto: {}, valores, ausencias: {}, erros: over.erros ?? [] };
}

function codigos(alertas) {
  return alertas.map((item) => item.codigo);
}

describe('validacoes', () => {
  it('detecta horários impossíveis sem alterar valores', () => {
    const r = registro({ valores: { DT_EMISSAO_BU: dataHora('2026-10-04 07:59:00') } });
    const { alertas } = validarRegistros([r], { leiaute: 'BWEB_45' });

    expect(codigos(alertas)).toContain('HORARIO_IMPOSSIVEL');
    expect(r.valores.DT_EMISSAO_BU.local).toBe('2026-10-04 07:59:00');
  });

  it('anula métrica divergente no mesmo BU', () => {
    const registros = [
      registro({ valores: { NR_VOTAVEL: 13, QT_APTOS: 300 } }),
      registro({ valores: { NR_VOTAVEL: 22, QT_APTOS: 300 } }),
      registro({ valores: { NR_VOTAVEL: 45, QT_APTOS: 301 } }),
    ];
    const { alertas } = validarRegistros(registros, { leiaute: 'BWEB_45' });

    expect(codigos(alertas)).toContain('METRICA_SECAO_DIVERGENTE');
    expect(registros.map((r) => r.valores.QT_APTOS)).toEqual([null, null, null]);
    expect(registros[0].valores.QT_COMPARECIMENTO).toBe(90);
  });

  it('rejeita chave duplicada e chave incompleta', () => {
    const duplicado = validarRegistros([registro(), registro({ valores: { NR_VOTAVEL: 13 } })], { leiaute: 'BWEB_45' });
    expect(duplicado.registros).toHaveLength(1);
    expect(codigos(duplicado.alertas)).toContain('CHAVE_DUPLICADA');

    const incompleto = validarRegistros([registro({ valores: { NR_SECAO: null } })], { leiaute: 'BWEB_45' });
    expect(incompleto.registros).toHaveLength(0);
    expect(codigos(incompleto.alertas)).toContain('CHAVE_INCOMPLETA');
  });

  it('alerta valor negativo inesperado', () => {
    const { alertas } = validarRegistros([registro({ valores: { QT_VOTOS: -5 } })], { leiaute: 'BWEB_45' });
    expect(codigos(alertas)).toContain('VALOR_NEGATIVO_INESPERADO');
  });

  it('detecta encoding suspeito e aceita Latin-1', () => {
    expect(encodingSuspeito(Buffer.from([0xef, 0xbb, 0xbf, 0x41]))).toBe(true);
    expect(encodingSuspeito(Buffer.from([0xc7]))).toBe(false);
  });

  it('alerta campo ausente conforme o leiaute', () => {
    const semEncerramento = validarRegistros(
      [registro({ valores: { DT_ENCERRAMENTO: null } })],
      { leiaute: 'BWEB_45' },
    );
    expect(codigos(semEncerramento.alertas)).toContain('CAMPO_AUSENTE');

    const semRecebimento2018 = validarRegistros(
      [registro({ valores: { DT_BU_RECEBIDO: null } })],
      { leiaute: 'BWEB_2018_42' },
    );
    expect(codigos(semRecebimento2018.alertas)).not.toContain('CAMPO_AUSENTE');
  });

  it('compara soma de votos com comparecimento só nos cargos do escopo', () => {
    const divergente = validarRegistros([registro({ valores: { QT_VOTOS: 10 } })], { leiaute: 'BWEB_45' });
    expect(codigos(divergente.alertas)).toContain('SOMA_VOTOS_DIVERGENTE');

    const ok = validarRegistros(
      [
        registro({ valores: { NR_VOTAVEL: 13, QT_VOTOS: 10 } }),
        registro({ valores: { NR_VOTAVEL: 22, QT_VOTOS: 80 } }),
      ],
      { leiaute: 'BWEB_45' },
    );
    expect(codigos(ok.alertas)).not.toContain('SOMA_VOTOS_DIVERGENTE');

    const foraDoEscopo = validarRegistros(
      [registro({ valores: { DS_CARGO_PERGUNTA: 'Senador', QT_VOTOS: 10 } })],
      { leiaute: 'BWEB_45' },
    );
    expect(codigos(foraDoEscopo.alertas)).not.toContain('SOMA_VOTOS_DIVERGENTE');
  });
});
