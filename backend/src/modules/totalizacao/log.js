import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { detectarFormato, extrairEntrada, listarEntradas } from './zip.js';

export const TIPO_EVENTO = Object.freeze({
  IDENTIFICADOR_DIGITADO: 'identificador_digitado',
  ELEITOR_HABILITADO: 'eleitor_habilitado',
  HABILITACAO_BIOMETRICA: 'habilitacao_biometrica',
  HABILITACAO_MANUAL: 'habilitacao_manual',
  TENTATIVA_DIGITAL: 'tentativa_digital',
  VOTO_CONFIRMADO: 'voto_confirmado',
  VOTO_COMPUTADO: 'voto_computado',
  TECLA_INDEVIDA: 'tecla_indevida',
  CORRECAO: 'correcao',
  URNA_PRONTA: 'urna_pronta',
  ENCERRAMENTO: 'encerramento',
  DESCONHECIDO: 'desconhecido',
});

const FORMATO_DATA = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;

const CLASSIFICADORES = Object.freeze([
  [/^Identificador (?:do eleitor )?digitado pelo mesário/, TIPO_EVENTO.IDENTIFICADOR_DIGITADO],
  [/^Eleitor foi habilitado$/, TIPO_EVENTO.ELEITOR_HABILITADO],
  [/^Tipo de habilitação do eleitor \[biométrica\]$/, TIPO_EVENTO.HABILITACAO_BIOMETRICA],
  [
    /^Solicitação de dado pessoal do eleitor para habilitação manual$/,
    TIPO_EVENTO.HABILITACAO_MANUAL,
  ],
  [
    /^(?:Solicita digital|Capturada a digital|Número de tentativas de reconhecimento do dedo|Timeout de reconhecimento do dedo)\./,
    TIPO_EVENTO.TENTATIVA_DIGITAL,
  ],
  [/^Voto confirmado para \[[^\]]+\]$/, TIPO_EVENTO.VOTO_CONFIRMADO],
  [/^O voto do eleitor foi computado$/, TIPO_EVENTO.VOTO_COMPUTADO],
  [/^Tecla indevida pressionada$/, TIPO_EVENTO.TECLA_INDEVIDA],
  [/^Eleitor corrigiu na tela de confirmação de candidato$/, TIPO_EVENTO.CORRECAO],
  [/^Urna pronta para receber votos$/, TIPO_EVENTO.URNA_PRONTA],
  [/^Procedimento de encerramento confirmado$/, TIPO_EVENTO.ENCERRAMENTO],
]);

function extrairLogd7z(conteudo) {
  const diretorio = mkdtempSync(path.join(tmpdir(), 'logjez-'));
  const arquivo = path.join(diretorio, 'log.jez');
  try {
    writeFileSync(arquivo, conteudo);
    return execFileSync('7z', ['e', '-so', arquivo, 'logd.dat'], {
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch {
    throw new Error('log.jez sem logd.dat');
  } finally {
    rmSync(diretorio, { recursive: true, force: true });
  }
}

export function extrairLogd(conteudo) {
  if (!Buffer.isBuffer(conteudo)) throw new TypeError('conteudo deve ser Buffer');
  if (detectarFormato(conteudo) === '7z') return extrairLogd7z(conteudo);
  const entrada = listarEntradas(conteudo).find((item) => item.nome === 'logd.dat');
  if (!entrada) throw new Error('log.jez sem logd.dat');
  return extrairEntrada(conteudo, entrada);
}

function classificar(mensagem) {
  const encontrado = CLASSIFICADORES.find(([padrao]) => padrao.test(mensagem));
  return encontrado ? encontrado[1] : TIPO_EVENTO.DESCONHECIDO;
}

function lerInstante(dataHora, linha) {
  const partes = FORMATO_DATA.exec(dataHora);
  if (!partes) throw new Error(`data/hora inválida no logd.dat: ${linha}`);
  const [, dia, mes, ano, hora, minuto, segundo] = partes;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function criarEvento(linha) {
  const campos = linha.split('\t');
  if (campos.length < 5) throw new Error(`linha fora do formato do logd.dat: ${linha}`);

  const [dataHora, nivel, urna, modulo] = campos;
  const hash = campos.length > 5 ? campos[campos.length - 1] : null;
  const textoOriginal = campos.slice(4, hash === null ? undefined : -1).join('\t');

  return {
    instante: lerInstante(dataHora, linha),
    nivel,
    urna,
    modulo,
    tipo: classificar(textoOriginal),
    textoOriginal,
    linhaOriginal: linha,
  };
}

export function parsearLogJez(conteudo) {
  const eventos = [];
  const ilegiveis = [];

  extrairLogd(conteudo)
    .toString('latin1')
    .split('\n')
    .forEach((linha, indice) => {
      if (linha.trim() === '') return;
      try {
        eventos.push(criarEvento(linha.replace(/\r$/, '')));
      } catch {
        ilegiveis.push(indice + 1);
      }
    });

  if (ilegiveis.length > 0) {
    throw new Error(
      `log corrompido na origem: ${ilegiveis.length} linhas ilegíveis (linhas ${ilegiveis.join(', ')})`,
    );
  }
  return eventos;
}
