import { describe, expect, it, vi } from 'vitest'
import { ApiError, api, montarQuery } from '../src/api/client'

function respostaErro(corpo, status = 400) {
  return {
    ok: false,
    status,
    json: async () => corpo,
  }
}

describe('client HTTP: erros e query string', () => {
  it('converte o corpo de erro da API em ApiError com código e detalhes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respostaErro({
          error: { code: 'VALIDATION', message: 'recorte inválido', details: [{ path: 'ano' }] },
        }),
      ),
    )

    const erro = await api.resumo({ ano: 2026 }).catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.message).toBe('Parâmetros inválidos.')
    expect(erro.status).toBe(400)
    expect(erro.code).toBe('VALIDATION')
    expect(erro.details).toEqual([{ path: 'ano' }])
  })

  it('mantém a mensagem da API quando o código não tem tradução', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respostaErro({ error: { code: 'DESCONHECIDO', message: 'falha específica' } }, 418),
      ),
    )

    const erro = await api.resumo({}).catch((e) => e)

    expect(erro.message).toBe('falha específica')
    expect(erro.code).toBe('DESCONHECIDO')
    expect(erro.details).toBeNull()
  })

  it('usa a mensagem padrão quando o corpo do erro não é JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('sem json')
        },
      })),
    )

    const erro = await api.eleicoes().catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(502)
    expect(erro.code).toBeNull()
    expect(erro.message).toContain('502')
  })

  it('omite parâmetros vazios da query string', () => {
    expect(montarQuery({ ano: 2026, uf: '', municipio: null, zona: undefined, cargo: 0 })).toBe(
      'ano=2026&cargo=0',
    )
  })

  it('mapeia cada recurso para a rota da API', async () => {
    const urls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        urls.push(url)
        return { ok: true, json: async () => ({}) }
      }),
    )

    await api.secao('urn/1', {})
    await api.secaoVersoes('urn/1', { pagina: 2 })
    await api.biometriaMunicipios({})
    await api.biometriaSecoes({})
    await api.encerramentoUrnas({})
    await api.encerramentoMunicipios({})
    await api.encerramentoSecoes({})
    await api.analise({})
    await api.anomalias({})
    await api.estatisticas({})
    await api.consistencia({})
    await api.concentracao({})
    await api.comparacaoLocal({})
    await api.comparacaoLocalSecoes({})
    await api.relatorio({})
    await api.comparacaoAnos({})
    await api.totalizacaoMetricas({})
    await api.totalizacaoIncidentes({})
    await api.totalizacaoDivergencias({})

    expect(urls).toContain('/api/sections/urn%2F1')
    expect(urls).toContain('/api/sections/urn%2F1/versions?pagina=2')
    expect(urls).toContain('/api/totalizacao/divergencias')
  })
})
