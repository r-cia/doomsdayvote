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

  it('lista resultados de 2010 a 1989 e só os arquivos do escopo', async () => {
    expect(anosDisponiveis('result')).toEqual([2010, 2006, 2002, 1998, 1994, 1990, 1989]);
    expect(anosDisponiveis('bweb')).not.toContain(2010);

    const base = 'https://cdn/odsele';
    const recursos = await listarRecursos('result', 2010, {
      fetch: async () =>
        resposta([
          { name: 'secao AC', url: `${base}/votacao_secao/votacao_secao_2010_AC.zip` },
          { name: 'secao BR', url: `${base}/votacao_secao/votacao_secao_2010_BR.zip` },
          { name: 'detalhe', url: `${base}/detalhe_votacao_secao/detalhe_votacao_secao_2010.zip` },
          { name: 'partido', url: `${base}/votacao_partido_munzona/votacao_partido_munzona_2010.zip` },
          { name: 'candidato', url: `${base}/votacao_candidato_munzona/votacao_candidato_munzona_2010.zip` },
        ]),
    });

    expect(recursos.map((recurso) => [recurso.nome, recurso.uf])).toEqual([
      ['secao AC', 'AC'],
      ['secao BR', 'BR'],
      ['detalhe', null],
      ['candidato', null],
    ]);
  });

  it('seleciona candidato e detalhe por UF em 1989 e por município em 1994', async () => {
    const base = 'https://cdn/odsele';
    const catalogo = async () =>
      resposta([
        { name: 'cand uf', url: `${base}/votacao_candidato_uf/votacao_candidato_uf_1989.zip` },
        { name: 'det uf', url: `${base}/detalhe_votacao_uf/detalhe_votacao_uf_1989.zip` },
        { name: 'cand mz', url: `${base}/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip` },
        { name: 'part mz', url: `${base}/votacao_partido_munzona/votacao_partido_munzona_1994.zip` },
      ]);

    expect((await listarRecursos('result', 1989, { fetch: catalogo })).map((r) => r.nome)).toEqual([
      'cand uf',
      'det uf',
    ]);
    expect((await listarRecursos('result', 1994, { fetch: catalogo })).map((r) => r.nome)).toEqual(['cand mz']);
  });

  it('inclui votacao_partido_uf em 1990', async () => {
    const base = 'https://cdn/odsele';
    const recursos = await listarRecursos('result', 1990, {
      fetch: async () =>
        resposta([
          { name: 'cand uf', url: `${base}/votacao_candidato_uf/votacao_candidato_uf_1990_AC.zip` },
          { name: 'part uf', url: `${base}/votacao_partido_uf/votacao_partido_uf_1990_AC.zip` },
          { name: 'part mz', url: `${base}/votacao_partido_munzona/votacao_partido_munzona_1990_AC.zip` },
        ]),
    });
    expect(recursos.map((r) => r.nome)).toEqual(['cand uf', 'part uf']);
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
