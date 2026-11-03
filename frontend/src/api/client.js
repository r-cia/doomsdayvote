const BASE = '/api'

export class ApiError extends Error {
  constructor(message, status, code = null, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function montarQuery(params = {}) {
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
    const erro = corpo?.error
    throw new ApiError(
      erro?.message ?? `Falha ao consultar a API (${resposta.status})`,
      resposta.status,
      erro?.code ?? null,
      erro?.details ?? null,
    )
  }

  return resposta.json()
}

const secao = (id) => `/sections/${encodeURIComponent(id)}`

export const api = {
  eleicoes: (signal) => obter('/elections', {}, signal),
  resumo: (params, signal) => obter('/summary', params, signal),
  timeline: (params, signal) => obter('/timeline', params, signal),
  mapa: (params, signal) => obter('/map', params, signal),
  secoes: (params, signal) => obter('/sections', params, signal),
  secao: (id, params, signal) => obter(secao(id), params, signal),
  secaoVersoes: (id, params, signal) => obter(`${secao(id)}/versions`, params, signal),
  biometriaMunicipios: (params, signal) => obter('/biometria/municipios', params, signal),
  biometriaSecoes: (params, signal) => obter('/biometria/secoes', params, signal),
  encerramentoUrnas: (params, signal) => obter('/encerramento/urnas', params, signal),
  encerramentoMunicipios: (params, signal) => obter('/encerramento/municipios', params, signal),
  encerramentoSecoes: (params, signal) => obter('/encerramento/secoes', params, signal),
  analise: (params, signal) => obter('/analysis', params, signal),
  anomalias: (params, signal) => obter('/anomalies', params, signal),
  estatisticas: (params, signal) => obter('/estatisticas', params, signal),
  consistencia: (params, signal) => obter('/consistencia', params, signal),
  concentracao: (params, signal) => obter('/concentracao', params, signal),
  comparacaoLocal: (params, signal) => obter('/comparacao-local', params, signal),
  comparacaoLocalSecoes: (params, signal) => obter('/comparacao-local/secoes', params, signal),
  relatorio: (params, signal) => obter('/relatorio', params, signal),
  comparacaoAnos: (params, signal) => obter('/comparacao-anos', params, signal),
  totalizacaoMetricas: (params, signal) => obter('/totalizacao/metricas', params, signal),
  totalizacaoIncidentes: (params, signal) => obter('/totalizacao/incidentes', params, signal),
  totalizacaoDivergencias: (params, signal) => obter('/totalizacao/divergencias', params, signal),
}
