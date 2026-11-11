import { describe, expect, it } from 'vitest';
import { parsearLogJez, TIPO_EVENTO } from '../../../src/modules/totalizacao/log.js';
import {
  biometriaPorFaixa,
  contarSemPar,
  incidentesDaSessao,
  parearEleitores,
  tempoDeVoto,
} from '../../../src/modules/totalizacao/metricas.js';
import { CENARIO, gerarLogJez } from '../../helpers/dados-sinteticos.js';

const eventos = parsearLogJez(gerarLogJez());

describe('métricas da sessão de votação', () => {
  it('pareia cada eleitor habilitado com o voto computado seguinte', () => {
    const eleitores = parearEleitores(eventos);
    expect(eleitores).toHaveLength(CENARIO.comparecimento);

    for (const eleitor of eleitores) {
      expect(eleitor.duracaoMs).toBeGreaterThan(0);
      expect(Date.parse(eleitor.computadoEm)).toBeGreaterThan(Date.parse(eleitor.habilitadoEm));
      expect(eleitor.habilitadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(typeof eleitor.correcao).toBe('boolean');
      expect(Number.isInteger(eleitor.qt_falhas_biometria)).toBe(true);
      expect(Number.isInteger(eleitor.qt_teclas_indevidas)).toBe(true);
      expect([1, 2, 3]).toContain(eleitor.tp_habilitacao);
    }
  });

  it('conta habilitações sem voto e votos sem habilitação', () => {
    expect(contarSemPar(eventos)).toEqual({ habilitacoesSemVoto: 0, votosSemHabilitacao: 0 });

    const comOrfaos = [
      { tipo: TIPO_EVENTO.VOTO_COMPUTADO, instante: '2026-10-04T07:00:05' },
      ...eventos,
      { tipo: TIPO_EVENTO.ELEITOR_HABILITADO, instante: '2026-10-04T16:59:00' },
    ];
    expect(contarSemPar(comOrfaos)).toEqual({ habilitacoesSemVoto: 1, votosSemHabilitacao: 1 });
  });

  it('pareia o voto com a última habilitação sem misturar as sessões', () => {
    const evento = (tipo, instante, textoOriginal = '') => ({
      tipo,
      instante,
      textoOriginal,
      nivel: 'INFO',
    });
    const eventosDuplos = [
      evento(TIPO_EVENTO.ELEITOR_HABILITADO, '2026-10-04T10:00:00'),
      evento(TIPO_EVENTO.HABILITACAO_BIOMETRICA, '2026-10-04T10:00:00'),
      evento(
        TIPO_EVENTO.TENTATIVA_DIGITAL,
        '2026-10-04T10:00:01',
        'Número de tentativas de reconhecimento do dedo. Quantidade: 1',
      ),
      evento(TIPO_EVENTO.ELEITOR_HABILITADO, '2026-10-04T10:00:05'),
      evento(TIPO_EVENTO.HABILITACAO_MANUAL, '2026-10-04T10:00:05'),
      evento(TIPO_EVENTO.TECLA_INDEVIDA, '2026-10-04T10:00:15'),
      evento(TIPO_EVENTO.CORRECAO, '2026-10-04T10:00:16'),
      evento(TIPO_EVENTO.VOTO_COMPUTADO, '2026-10-04T10:00:20'),
    ];

    expect(parearEleitores(eventosDuplos)).toEqual([
      {
        habilitadoEm: '2026-10-04T10:00:05',
        computadoEm: '2026-10-04T10:00:20',
        duracaoMs: 15000,
        tp_habilitacao: 3,
        qt_falhas_biometria: 0,
        qt_teclas_indevidas: 1,
        correcao: true,
      },
    ]);
    expect(contarSemPar(eventosDuplos)).toEqual({
      habilitacoesSemVoto: 1,
      votosSemHabilitacao: 0,
    });
  });

  it('mantém eventos finais sem voto fora do eleitor anterior', () => {
    const evento = (tipo, instante, textoOriginal = '') => ({
      tipo,
      instante,
      textoOriginal,
      nivel: 'INFO',
    });
    const semVotoFinal = [
      evento(TIPO_EVENTO.ELEITOR_HABILITADO, '2026-10-04T10:00:00'),
      evento(TIPO_EVENTO.HABILITACAO_BIOMETRICA, '2026-10-04T10:00:00'),
      evento(
        TIPO_EVENTO.TENTATIVA_DIGITAL,
        '2026-10-04T10:00:01',
        'Número de tentativas de reconhecimento do dedo. Quantidade: 1',
      ),
      evento(TIPO_EVENTO.VOTO_COMPUTADO, '2026-10-04T10:00:20'),
      evento(TIPO_EVENTO.ELEITOR_HABILITADO, '2026-10-04T10:00:30'),
      evento(TIPO_EVENTO.HABILITACAO_BIOMETRICA, '2026-10-04T10:00:30'),
      ...[31, 32, 33].map((segundo) =>
        evento(
          TIPO_EVENTO.TENTATIVA_DIGITAL,
          `2026-10-04T10:00:${segundo}`,
          'Número de tentativas de reconhecimento do dedo. Quantidade: 1',
        ),
      ),
      evento(TIPO_EVENTO.TECLA_INDEVIDA, '2026-10-04T10:00:34'),
      evento(TIPO_EVENTO.CORRECAO, '2026-10-04T10:00:35'),
    ];

    const eleitores = parearEleitores(semVotoFinal);
    expect(eleitores).toHaveLength(1);
    expect(eleitores[0]).toMatchObject({
      habilitadoEm: '2026-10-04T10:00:00',
      computadoEm: '2026-10-04T10:00:20',
      duracaoMs: 20000,
      tp_habilitacao: 2,
      qt_falhas_biometria: 1,
      qt_teclas_indevidas: 0,
      correcao: false,
    });
    expect(contarSemPar(semVotoFinal)).toEqual({
      habilitacoesSemVoto: 1,
      votosSemHabilitacao: 0,
    });
    expect(tempoDeVoto(semVotoFinal)).toMatchObject({
      quantidade: 1,
      mediaMs: 20000,
      medianaMs: 20000,
    });
    expect(biometriaPorFaixa(semVotoFinal)).toEqual({
      falhou1: 1,
      falhou2: 0,
      falhou3: 1,
      falhou4: 0,
      manual: 0,
    });
  });

  it('resume o tempo de voto dos três eleitores', () => {
    expect(tempoDeVoto(eventos)).toEqual({
      quantidade: 3,
      mediaMs: 20000,
      medianaMs: 20000,
      maisRapidoMs: 10000,
      maisDemoradoMs: 30000,
    });
  });

  it('classifica a biometria por quantidade de falhas', () => {
    const faixas = biometriaPorFaixa(eventos);
    expect(faixas).toEqual({
      falhou1: 1,
      falhou2: 1,
      falhou3: 0,
      falhou4: 0,
      manual: 0,
    });
  });

  it('lista os incidentes da sessão', () => {
    const incidentes = incidentesDaSessao(eventos);
    expect(incidentes).toHaveLength(1);

    for (const incidente of incidentes) {
      expect(incidente.nivel).not.toBe('INFO');
      expect(incidente).toEqual({
        instante: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
        nivel: incidente.nivel,
        tipo: incidente.tipo,
        textoOriginal: incidente.textoOriginal,
      });
    }
  });
});
