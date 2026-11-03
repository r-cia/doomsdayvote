import { describe, expect, it } from 'vitest';
import { linhaDeEvento, registrarEventoCarga } from '../../src/lib/log-carga.js';

describe('log de carga', () => {
  it('monta a linha com evento, instante e contexto', () => {
    const instante = new Date('2026-11-03T10:00:00.000Z');
    const linha = linhaDeEvento(
      'lote_concluido',
      {
        arquivo: 'bweb.csv',
        uf: 'SP',
        ano: 2022,
        turno: 1,
        lote_id: 'lote-1',
        duracao_ms: 1500,
        linhas: 10,
        erros: 0,
        alertas: 2,
      },
      instante,
    );

    expect(linha).toEqual({
      evento: 'lote_concluido',
      instante: '2026-11-03T10:00:00.000Z',
      arquivo: 'bweb.csv',
      uf: 'SP',
      ano: 2022,
      turno: 1,
      lote_id: 'lote-1',
      duracao_ms: 1500,
      linhas: 10,
      erros: 0,
      alertas: 2,
    });
  });

  it('escreve uma linha JSON por evento', () => {
    const linhas = [];
    registrarEventoCarga('carga_iniciada', { arquivos: 3 }, (texto) => linhas.push(texto));

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).not.toContain('\n');
    const evento = JSON.parse(linhas[0]);
    expect(evento.evento).toBe('carga_iniciada');
    expect(evento.arquivos).toBe(3);
    expect(Number.isNaN(Date.parse(evento.instante))).toBe(false);
  });

  it('não propaga segredo presente no contexto', () => {
    const linha = linhaDeEvento('lote_falhou', {
      arquivo: 'bweb.csv',
      DATABASE_URL: 'postgres://usuario:senha@host/banco',
      senha: 'segredo',
      token: 'token-de-acesso',
      erro_codigo: 'ERRO_INTERNO',
      erro_mensagem: 'falhou',
    });

    const texto = JSON.stringify(linha);
    expect(texto).not.toContain('postgres://');
    expect(texto).not.toContain('segredo');
    expect(texto).not.toContain('token-de-acesso');
    expect(linha.erro_codigo).toBe('ERRO_INTERNO');
  });

  it('omite campos ausentes', () => {
    const linha = linhaDeEvento('carga_concluida', { falhas: 0, ignorados: undefined, alertas: null });

    expect(linha).toHaveProperty('falhas', 0);
    expect(linha).not.toHaveProperty('ignorados');
    expect(linha).not.toHaveProperty('alertas');
  });
});
