import { describe, expect, it } from 'vitest';
import { validarConsistenciaBu } from '../../../src/modules/analise/consistencia.js';

const buOk = {
  qt_aptos: 100,
  qt_comparecimento: 80,
  qt_abstencoes: 20,
  qt_elei_biom_sem_habilitacao: 10,
};

const resultadosOk = [{ qt_votos: 50 }, { qt_votos: 30 }];

describe('validarConsistenciaBu', () => {
  it('classifica todas as regras como ok quando consistentes', () => {
    const regras = validarConsistenciaBu(buOk, resultadosOk);
    expect(regras).toHaveLength(4);
    expect(regras.every((r) => r.status === 'ok')).toBe(true);
    const comp = regras.find((r) => r.regra === 'comparecimento_vs_votos');
    expect(comp.diferenca).toBe(0);
    expect(comp.campos).toContain('qt_comparecimento');
  });

  it('detecta divergência em comparecimento_vs_votos', () => {
    const regras = validarConsistenciaBu(buOk, [{ qt_votos: 90 }]);
    const comp = regras.find((r) => r.regra === 'comparecimento_vs_votos');
    expect(comp.status).toBe('divergente');
    expect(comp.diferenca).toBe(10);
  });

  it('detecta divergência quando comparecimento > aptos', () => {
    const regras = validarConsistenciaBu(
      { ...buOk, qt_comparecimento: 90, qt_aptos: 80 },
      resultadosOk,
    );
    const regra = regras.find((r) => r.regra === 'comparecimento_vs_aptos');
    expect(regra.status).toBe('divergente');
    expect(regra.diferenca).toBe(10);
  });

  it('detecta divergência quando biometria > comparecimento', () => {
    const regras = validarConsistenciaBu(
      { ...buOk, qt_elei_biom_sem_habilitacao: 90 },
      resultadosOk,
    );
    const regra = regras.find((r) => r.regra === 'biometria_vs_comparecimento');
    expect(regra.status).toBe('divergente');
    expect(regra.diferenca).toBe(10);
  });

  it('marca dados_insuficientes e não divergente quando campo ausente', () => {
    const regras = validarConsistenciaBu(
      { qt_aptos: 100, qt_comparecimento: null, qt_abstencoes: 20, qt_elei_biom_sem_habilitacao: 10 },
      resultadosOk,
    );
    const aptos = regras.find((r) => r.regra === 'aptos_vs_comparecimento_abstencao');
    expect(aptos.status).toBe('dados_insuficientes');
    const comp = regras.find((r) => r.regra === 'comparecimento_vs_votos');
    expect(comp.status).toBe('dados_insuficientes');
    const compAptos = regras.find((r) => r.regra === 'comparecimento_vs_aptos');
    expect(compAptos.status).toBe('dados_insuficientes');
  });

  it('não classifica divergência para biometria ausente', () => {
    const regras = validarConsistenciaBu(
      { ...buOk, qt_elei_biom_sem_habilitacao: undefined },
      resultadosOk,
    );
    const regra = regras.find((r) => r.regra === 'biometria_vs_comparecimento');
    expect(regra.status).toBe('dados_insuficientes');
    expect(regra.diferenca).toBeNull();
  });
});