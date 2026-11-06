import { describe, expect, it } from 'vitest';
import {
  anosDisponiveis,
  datasetDoAno,
  filtrarRecursos,
  listarRecursos,
} from '../../../src/modules/aquisicao/tse.js';

function resposta(resources) {
  return { ok: true, json: async () => ({ success: true, result: { resources } }) };
}

describe('catálogo do TSE', () => {
  it('lista os anos disponíveis por tipo', () => {
    expect(anosDisponiveis('bu')).toEqual([2026, 2022]);
    expect(anosDisponiveis('bweb')).toContain(2014);
    expect(anosDisponiveis('bweb')).toContain(2026);
  });

  it('recusa ano sem dataset', () => {
    expect(() => datasetDoAno('bu', 2018)).toThrow(/não possui dataset/);
    expect(() => anosDisponiveis('outro')).toThrow(/desconhecido/);
  });

  it('lê recursos e ignora assinaturas', async () => {
    const recursos = await listarRecursos('bu', 2026, {
      fetch: async () =>
        resposta([
          { name: 'AC 1t', url: 'https://cdn/bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip' },
          { name: 'AC hash', url: 'https://cdn/bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip.sha512' },
        ]),
    });

    expect(recursos).toEqual([
      {
        nome: 'AC 1t',
        url: 'https://cdn/bu_imgbu_logjez_rdv_vscmr_2026_1t_AC.zip',
        uf: 'AC',
        turno: 1,
      },
    ]);
  });

  it('ignora assinatura sha1 do boletim de urna', async () => {
    const recursos = await listarRecursos('bweb', 2014, {
      fetch: async () =>
        resposta([
          { name: 'AC', url: 'https://cdn/bweb_1t_AC_14102014131600.zip' },
          { name: 'AC hash', url: 'https://cdn/bweb_1t_AC_14102014131600.zip.sha1' },
        ]),
    });

    expect(recursos).toEqual([
      {
        nome: 'AC',
        url: 'https://cdn/bweb_1t_AC_14102014131600.zip',
        uf: 'AC',
        turno: 1,
      },
    ]);
  });

  it('filtra por UF e turno', async () => {
    const recursos = await listarRecursos('bweb', 2026, {
      fetch: async () =>
        resposta([
          { name: 'AC', url: 'https://cdn/bweb_1t_AC_051020261403.zip' },
          { name: 'SP', url: 'https://cdn/bweb_2t_SP_261020260742.zip' },
        ]),
    });

    expect(filtrarRecursos(recursos, { ufs: ['sp'], turnos: [2] })).toHaveLength(1);
    expect(filtrarRecursos(recursos, { turnos: [1] })[0].uf).toBe('AC');
  });
});
