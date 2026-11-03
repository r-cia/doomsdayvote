import { describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../src/api/client'

function responder(status, corpo) {
  const fetch = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => corpo })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('cliente HTTP', () => {
  it('omite parâmetros vazios e codifica o id da seção', async () => {
    const fetch = responder(200, {})
    await api.secaoVersoes('a/b', { cargo: 1, uf: null, zona: '' }, undefined)
    expect(fetch.mock.calls[0][0]).toBe('/api/sections/a%2Fb/versions?cargo=1')
  })

  it.each([
    ['comparacaoLocalSecoes', '/api/comparacao-local/secoes'],
    ['totalizacaoMetricas', '/api/totalizacao/metricas'],
    ['totalizacaoIncidentes', '/api/totalizacao/incidentes'],
    ['totalizacaoDivergencias', '/api/totalizacao/divergencias'],
    ['consistencia', '/api/consistencia'],
    ['concentracao', '/api/concentracao'],
    ['relatorio', '/api/relatorio'],
    ['comparacaoAnos', '/api/comparacao-anos'],
  ])('%s consulta %s', async (nome, caminho) => {
    const fetch = responder(200, {})
    await api[nome]({})
    expect(fetch.mock.calls[0][0]).toBe(caminho)
  })

  it('erro 400 do backend vira ApiError com code, message e details', async () => {
    responder(400, { error: { code: 'VALIDATION', message: 'cargo inválido', details: { campo: 'cargo' } } })
    const erro = await api.resumo({}).catch((e) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({
      status: 400,
      code: 'VALIDATION',
      message: 'Parâmetros inválidos.',
      details: { campo: 'cargo' },
    })
  })

  it('código de erro desconhecido mostra a mensagem da API', async () => {
    responder(409, { error: { code: 'OUTRO', message: 'conflito qualquer' } })
    const erro = await api.resumo({}).catch((e) => e)
    expect(erro).toMatchObject({ code: 'OUTRO', message: 'conflito qualquer' })
  })

  it('erro sem corpo JSON usa a mensagem padrão e code nulo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error() } }))
    const erro = await api.resumo({}).catch((e) => e)
    expect(erro).toMatchObject({ status: 502, code: null, message: 'Falha ao consultar a API (502)' })
  })
})
