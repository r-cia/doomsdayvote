const BASE = '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
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
    let mensagem = `Falha ao consultar a API (${resposta.status})`
    const corpo = await resposta.json().catch(() => null)
    if (corpo) {
      mensagem = corpo.message ?? corpo.mensagem ?? corpo.erro ?? mensagem
    }
    throw new ApiError(mensagem, resposta.status)
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
  analise: (params, signal) => obter('/analysis', params, signal),
  anomalias: (params, signal) => obter('/anomalies', params, signal),
  estatisticas: (params, signal) => obter('/estatisticas', params, signal),
  secao: (id, params, signal) =>
    obter(`/sections/${encodeURIComponent(id)}`, params, signal),
  secaoVersoes: (id, params, signal) =>
    obter(`/sections/${encodeURIComponent(id)}/versions`, params, signal),
  consistencia: (params, signal) => obter('/consistencia', params, signal),
}
