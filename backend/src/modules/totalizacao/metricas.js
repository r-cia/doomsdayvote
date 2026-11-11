import { TIPO_EVENTO } from './log.js';

const PREFIXO_FALHA_DIGITAL = 'Número de tentativas de reconhecimento do dedo';

const TP_HABILITACAO = Object.freeze({
  IDENTIFICADOR: 1,
  BIOMETRICA: 2,
  MANUAL: 3,
});

function janelasDaSessao(eventos) {
  const janelas = [];
  let atual = null;

  for (const evento of eventos) {
    const jaHabilitado =
      evento.tipo === TIPO_EVENTO.ELEITOR_HABILITADO &&
      atual?.some((item) => item.tipo === TIPO_EVENTO.ELEITOR_HABILITADO);
    if (jaHabilitado) {
      janelas.push(atual);
      atual = [];
    }

    if (!atual) atual = [];
    atual.push(evento);

    if (evento.tipo === TIPO_EVENTO.VOTO_COMPUTADO) {
      janelas.push(atual);
      atual = null;
    }
  }

  if (atual) janelas.push(atual);

  return janelas;
}

function duracaoEntre(inicio, fim) {
  return Date.parse(fim) - Date.parse(inicio);
}

function contarFalhasBiometria(eventos) {
  return eventos.filter((evento) => evento.textoOriginal.startsWith(PREFIXO_FALHA_DIGITAL)).length;
}

function tipoHabilitacao(eventos) {
  if (eventos.some((evento) => evento.tipo === TIPO_EVENTO.HABILITACAO_BIOMETRICA)) {
    return TP_HABILITACAO.BIOMETRICA;
  }
  if (eventos.some((evento) => evento.tipo === TIPO_EVENTO.HABILITACAO_MANUAL)) {
    return TP_HABILITACAO.MANUAL;
  }
  return TP_HABILITACAO.IDENTIFICADOR;
}

export function parearEleitores(eventos) {
  const pares = [];

  for (const janela of janelasDaSessao(eventos)) {
    const habilitado = janela.find((evento) => evento.tipo === TIPO_EVENTO.ELEITOR_HABILITADO);
    const computado = janela.find((evento) => evento.tipo === TIPO_EVENTO.VOTO_COMPUTADO);
    if (!habilitado || !computado) continue;

    pares.push({
      habilitadoEm: habilitado.instante,
      computadoEm: computado.instante,
      duracaoMs: duracaoEntre(habilitado.instante, computado.instante),
      tp_habilitacao: tipoHabilitacao(janela),
      qt_falhas_biometria: contarFalhasBiometria(janela),
      qt_teclas_indevidas: janela.filter(
        (evento) => evento.tipo === TIPO_EVENTO.TECLA_INDEVIDA,
      ).length,
      correcao: janela.some((evento) => evento.tipo === TIPO_EVENTO.CORRECAO),
    });
  }

  return pares;
}

export function contarSemPar(eventos) {
  let habilitacoesSemVoto = 0;
  let votosSemHabilitacao = 0;

  for (const janela of janelasDaSessao(eventos)) {
    const habilitados = janela.filter(
      (evento) => evento.tipo === TIPO_EVENTO.ELEITOR_HABILITADO,
    ).length;
    const computados = janela.filter((evento) => evento.tipo === TIPO_EVENTO.VOTO_COMPUTADO).length;
    habilitacoesSemVoto += Math.max(0, habilitados - computados);
    votosSemHabilitacao += Math.max(0, computados - habilitados);
  }

  return { habilitacoesSemVoto, votosSemHabilitacao };
}

export function tempoDeVoto(eventos) {
  const duracoes = parearEleitores(eventos)
    .map((eleitor) => eleitor.duracaoMs)
    .sort((a, b) => a - b);

  if (duracoes.length === 0) {
    return {
      quantidade: 0,
      mediaMs: null,
      medianaMs: null,
      maisRapidoMs: null,
      maisDemoradoMs: null,
    };
  }

  const meio = Math.floor(duracoes.length / 2);
  const medianaMs =
    duracoes.length % 2 === 0 ? (duracoes[meio - 1] + duracoes[meio]) / 2 : duracoes[meio];

  return {
    quantidade: duracoes.length,
    mediaMs: duracoes.reduce((total, duracao) => total + duracao, 0) / duracoes.length,
    medianaMs,
    maisRapidoMs: duracoes[0],
    maisDemoradoMs: duracoes[duracoes.length - 1],
  };
}

export function biometriaPorFaixa(eventos) {
  const faixas = {
    falhou1: 0,
    falhou2: 0,
    falhou3: 0,
    falhou4: 0,
    manual: 0,
  };

  for (const janela of janelasDaSessao(eventos)) {
    if (!janela.some((evento) => evento.tipo === TIPO_EVENTO.ELEITOR_HABILITADO)) continue;

    if (janela.some((evento) => evento.tipo === TIPO_EVENTO.HABILITACAO_MANUAL)) {
      faixas.manual += 1;
      continue;
    }

    if (!janela.some((evento) => evento.tipo === TIPO_EVENTO.HABILITACAO_BIOMETRICA)) {
      continue;
    }

    const falhas = contarFalhasBiometria(janela);
    if (falhas === 1) faixas.falhou1 += 1;
    else if (falhas === 2) faixas.falhou2 += 1;
    else if (falhas === 3) faixas.falhou3 += 1;
    else if (falhas >= 4) faixas.falhou4 += 1;
  }

  return faixas;
}

export function incidentesDaSessao(eventos) {
  return eventos
    .filter((evento) => evento.nivel !== 'INFO')
    .map((evento) => ({
      instante: evento.instante,
      nivel: evento.nivel,
      tipo: evento.tipo,
      textoOriginal: evento.textoOriginal,
    }));
}

export async function registrarEleitores(db, totalizacaoSecaoId, eventos) {
  const linhas = parearEleitores(eventos).map((eleitor) => ({
    totalizacao_secao_id: totalizacaoSecaoId,
    habilitado_em: eleitor.habilitadoEm,
    computado_em: eleitor.computadoEm,
    duracao_ms: eleitor.duracaoMs,
    qt_falhas_biometria: eleitor.qt_falhas_biometria,
    tp_habilitacao: eleitor.tp_habilitacao,
    qt_teclas_indevidas: eleitor.qt_teclas_indevidas,
    correcao: eleitor.correcao,
  }));

  if (linhas.length === 0) return;
  await db.insertInto('totalizacao_eleitor').values(linhas).execute();
}

export async function registrarIncidentes(db, totalizacaoSecaoId, eventos) {
  const linhas = incidentesDaSessao(eventos).map((incidente) => ({
    totalizacao_secao_id: totalizacaoSecaoId,
    dt_incidente: incidente.instante,
    nivel: incidente.nivel,
    tipo: incidente.tipo,
    texto_original: incidente.textoOriginal,
  }));

  if (linhas.length === 0) return;
  await db.insertInto('totalizacao_incidente').values(linhas).execute();
}
