import { describe, expect, it } from 'vitest';
import {
  extrairLogd,
  parsearLogJez,
  TIPO_EVENTO,
} from '../../../src/modules/totalizacao/log.js';
import { CENARIO, gerarLogJez } from '../../helpers/dados-sinteticos.js';

const conteudo = gerarLogJez();
const eventos = parsearLogJez(conteudo);

const EVENTOS_DO_CENARIO = 17;

function contar(tipo) {
  return eventos.filter((evento) => evento.tipo === tipo).length;
}

describe('parser do log.jez', () => {
  it('lê o logd.dat dentro do zip', () => {
    const texto = extrairLogd(conteudo).toString('latin1');
    expect(texto.startsWith('04/10/2026 07:00:01\tINFO\t999999\tURNA')).toBe(true);
    expect(texto).toContain('\tUrna pronta para receber votos\t');
  });

  it('converte cada linha em evento com instante, tipo e texto original', () => {
    expect(eventos).toHaveLength(EVENTOS_DO_CENARIO);
    expect(eventos[0]).toMatchObject({
      instante: '2026-10-04T07:00:01',
      nivel: 'INFO',
      urna: '999999',
      modulo: 'URNA',
      tipo: TIPO_EVENTO.URNA_PRONTA,
      textoOriginal: 'Urna pronta para receber votos',
    });
    expect(eventos[0].linhaOriginal).toBe(
      '04/10/2026 07:00:01\tINFO\t999999\tURNA\tUrna pronta para receber votos\t0000000000000000',
    );
  });

  it('mapeia os eventos de voto, biometria e incidentes da votação', () => {
    expect(contar(TIPO_EVENTO.VOTO_COMPUTADO)).toBe(CENARIO.comparecimento);
    expect(contar(TIPO_EVENTO.ELEITOR_HABILITADO)).toBe(3);
    expect(contar(TIPO_EVENTO.HABILITACAO_BIOMETRICA)).toBe(3);
    expect(contar(TIPO_EVENTO.HABILITACAO_MANUAL)).toBe(0);
    expect(contar(TIPO_EVENTO.VOTO_CONFIRMADO)).toBe(0);
    expect(contar(TIPO_EVENTO.TENTATIVA_DIGITAL)).toBe(3);
    expect(contar(TIPO_EVENTO.IDENTIFICADOR_DIGITADO)).toBe(0);
    expect(contar(TIPO_EVENTO.TECLA_INDEVIDA)).toBe(1);
    expect(contar(TIPO_EVENTO.CORRECAO)).toBe(1);
    expect(contar(TIPO_EVENTO.URNA_PRONTA)).toBe(1);
    expect(contar(TIPO_EVENTO.ENCERRAMENTO)).toBe(1);
  });

  it('registra a abertura e o encerramento da votação', () => {
    const abertura = eventos.find((evento) => evento.tipo === TIPO_EVENTO.URNA_PRONTA);
    expect(abertura.instante).toBe(CENARIO.aberturaEvento);
    expect(abertura.textoOriginal).toBe('Urna pronta para receber votos');

    const encerramento = eventos.find((evento) => evento.tipo === TIPO_EVENTO.ENCERRAMENTO);
    expect(encerramento.instante).toBe(CENARIO.encerramentoEvento);
    expect(encerramento.textoOriginal).toBe('Procedimento de encerramento confirmado');
  });

  it('preserva a mensagem original de tipo desconhecido', () => {
    const desconhecido = eventos.find(
      (evento) => evento.textoOriginal === CENARIO.incidente.texto,
    );
    expect(desconhecido.tipo).toBe(TIPO_EVENTO.DESCONHECIDO);
    expect(desconhecido.textoOriginal).toBe(CENARIO.incidente.texto);
  });

  it('classifica o nível de cada evento', () => {
    const alertas = eventos.filter((evento) => evento.nivel !== 'INFO');
    expect(alertas).toHaveLength(1);
    expect(alertas.every((evento) => evento.nivel === CENARIO.incidente.nivel)).toBe(true);
  });
});
