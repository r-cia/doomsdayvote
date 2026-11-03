const BASE = '/api'

import { mensagemErroApi } from '../lib/erros-api'

export class ApiError extends Error {
  constructor(message, status, codigo = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
  }
}

function montarQuery(params = {}) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== null && valor !== undefined && valor !== '') {
      busca.set(chave, String(valor))
    }
  }
  return busca.toString()
}

async function obter(caminho, params, signal) {
  const query = montarQuery(params)
  const resposta = await fetch(`${BASE}${caminho}${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const erro = corpo?.error ?? corpo ?? {}
    const codigo = erro.code ?? erro.codigo ?? null
    const mensagem = mensagemErroApi({ codigo, mensagem: erro.message ?? erro.mensagem }, resposta.status)
    throw new ApiError(mensagem, resposta.status, codigo)
  }

  return resposta.json()
}

export const api = {
  eleicoes: (signal) => obter('/elections', {}, signal),
  resumo: (params, signal) => obter('/summary', params, signal),
  timeline: (params, signal) => obter('/timeline', params, signal),
  mapa: (params, signal) => obter('/map', params, signal),
  secoes: (params, signal) => obter('/sections', params, signal),
  biometriaMunicipios: (params, signal) => obter('/biometria/municipios', params, signal),
  biometriaSecoes: (params, signal) => obter('/biometria/secoes', params, signal),
  encerramentoUrnas: (params, signal) => obter('/encerramento/urnas', params, signal),
  encerramentoMunicipios: (params, signal) => obter('/encerramento/municipios', params, signal),
  encerramentoSecoes: (params, signal) => obter('/encerramento/secoes', params, signal),
  comparacaoAnos: (params, signal) => obter('/comparacao-anos', params, signal),
  analise: (params, signal) => obter('/analysis', params, signal),
  anomalias: (params, signal) => obter('/anomalies', params, signal),
  estatisticas: (params, signal) => obter('/estatisticas', params, signal),
  secao: (id, params, signal) =>
    obter(`/sections/${encodeURIComponent(id)}`, params, signal),
  secaoVersoes: (id, params, signal) =>
    obter(`/sections/${encodeURIComponent(id)}/versions`, params, signal),
  consistencia: (params, signal) => obter('/consistencia', params, signal),
  comparacaoLocal: (params, signal) => obter('/comparacao-local', params, signal),
  comparacaoLocalSecoes: (params, signal) => obter('/comparacao-local/secoes', params, signal),
  concentracao: (params, signal) => obter('/concentracao', params, signal),
  relatorio: (params, signal) => obter('/relatorio', params, signal),
  totalizacaoMetricas: (params, signal) => obter('/totalizacao/metricas', params, signal),
  totalizacaoIncidentes: (params, signal) => obter('/totalizacao/incidentes', params, signal),
  totalizacaoDivergencias: (params, signal) => obter('/totalizacao/divergencias', params, signal),
}
