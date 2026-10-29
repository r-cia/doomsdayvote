import { describe, expect, it } from 'vitest';
import { classificarStatusSecao } from '../../src/modules/apuracao/status-secao.js';

function bu(over = {}) {
  return {
    cd_tipo_urna: 1,
    ds_tipo_urna: 'Apurada',
    precisao_dt_bu_recebido: 'DATA_HORA',
    dt_abertura: new Date('2026-10-04T11:00:00Z'),
    dt_encerramento: new Date('2026-10-04T20:00:00Z'),
    dt_emissao_bu: new Date('2026-10-04T20:05:00Z'),
    dt_bu_recebido_ts: new Date('2026-10-04T21:00:00Z'),
    dt_bu_recebido_data: null,
    ...over,
  };
}

const intradiario = (iso) => ({ tipo: 'recebimento_intradiario', instante: new Date(iso) });

describe('classificarStatusSecao', () => {
  it('sem BU', () => {
    expect(classificarStatusSecao(null, { tipo: 'final' }).status).toBe('sem_bu');
  });

  it('tipos de urna 2..5 têm status próprio', () => {
    expect(classificarStatusSecao(bu({ cd_tipo_urna: 2 }), { tipo: 'final' }).status).toBe('nao_apurada');
    expect(classificarStatusSecao(bu({ cd_tipo_urna: 3 }), { tipo: 'final' }).status).toBe('anulada_apurada_separado');
    expect(classificarStatusSecao(bu({ cd_tipo_urna: 4 }), { tipo: 'final' }).status).toBe('anulada');
    expect(classificarStatusSecao(bu({ cd_tipo_urna: 5 }), { tipo: 'final' }).status).toBe('nao_instalada');
  });

  it('tipo de urna ausente ou inválido é desconhecido', () => {
    expect(classificarStatusSecao(bu({ cd_tipo_urna: null }), { tipo: 'final' })).toMatchObject({
      status: 'desconhecido',
      motivo: 'TIPO_URNA_AUSENTE',
    });
  });

  it('intradiário distingue recebido, encerrado aguardando e sem BU', () => {
    expect(classificarStatusSecao(bu(), intradiario('2026-10-04T20:30:00Z')).status).toBe('encerrada_aguardando_bu');
    expect(classificarStatusSecao(bu(), intradiario('2026-10-04T21:00:00Z')).status).toBe('bu_recebido');
    expect(
      classificarStatusSecao(
        bu({ dt_encerramento: null, dt_emissao_bu: null }),
        intradiario('2026-10-04T19:59:00Z'),
      ).status,
    ).toBe('sem_bu');
  });

  it('DATA em corte intradiário é desconhecido; no dia é recebido', () => {
    const antigo = bu({
      precisao_dt_bu_recebido: 'DATA',
      dt_bu_recebido_ts: null,
      dt_bu_recebido_data: '2014-10-05',
    });
    expect(classificarStatusSecao(antigo, intradiario('2014-10-05T12:00:00Z'))).toMatchObject({
      status: 'desconhecido',
      motivo: 'PRECISAO_INSUFICIENTE',
    });
    expect(classificarStatusSecao(antigo, { tipo: 'recebimento_diario', data: '2014-10-05' }).status).toBe('bu_recebido');
    expect(classificarStatusSecao(antigo, { tipo: 'recebimento_diario', data: '2014-10-04' }).status).toBe('sem_bu');
  });

  it('AUSENTE só é recebido no corte final', () => {
    const ausente = bu({ precisao_dt_bu_recebido: 'AUSENTE', dt_bu_recebido_ts: null, dt_bu_recebido_data: null });
    expect(classificarStatusSecao(ausente, { tipo: 'final' }).status).toBe('bu_recebido');
    expect(classificarStatusSecao(ausente, { tipo: 'recebimento_diario', data: '2018-10-30' })).toMatchObject({
      status: 'desconhecido',
      motivo: 'PRECISAO_INSUFICIENTE',
    });
  });

  it('não expõe horário do último voto', () => {
    const saida = classificarStatusSecao(bu(), { tipo: 'final' });
    expect(JSON.stringify(saida)).not.toContain('ultimo_voto');
  });
});
