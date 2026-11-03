import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import IncidentesPanel from '../src/components/IncidentesPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({
  api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }),
}))

const item = { instante: '2022-10-02T20:00:00Z', nivel: 'ERRO', tipo: 'X', texto_original: 'texto', sg_uf: 'AC', cd_municipio_tse: 1, nr_zona: 2, nr_secao: 3 }

beforeEach(() => api.totalizacaoIncidentes.mockClear())

describe('IncidentesPanel', () => {
  it('fica recolhido e só consulta ao expandir', async () => {
    api.totalizacaoIncidentes.mockResolvedValue({ itens: [item], total: 60, pagina: 1, tamanho: 25 })
    const w = await montar(IncidentesPanel)
    expect(api.totalizacaoIncidentes).not.toHaveBeenCalled()
    await w.find('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(api.totalizacaoIncidentes.mock.calls[0][0]).toMatchObject({ ano: 2022, turno: 1, pagina: 1, tamanho: 25 })
    expect(w.text()).toContain('AC · 1 · zona 2 · seção 3')
  })

  it('pagina de 25 em 25', async () => {
    api.totalizacaoIncidentes.mockResolvedValue({ itens: [item], total: 60, pagina: 1, tamanho: 25 })
    const w = await montar(IncidentesPanel)
    await w.find('button[aria-expanded]').trigger('click')
    await flushPromises()
    await w.find('button[aria-label="Próxima página"]').trigger('click')
    await flushPromises()
    expect(api.totalizacaoIncidentes.mock.calls.at(-1)[0].pagina).toBe(2)
  })

  it('mostra a mensagem de vazio', async () => {
    api.totalizacaoIncidentes.mockResolvedValue({ itens: [], total: 0, pagina: 1, tamanho: 25 })
    const w = await montar(IncidentesPanel)
    await w.find('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Nenhum incidente neste recorte.')
  })
})
