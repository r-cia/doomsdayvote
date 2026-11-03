import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import EncerramentoView from '../src/views/EncerramentoView.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))
vi.mock('../src/views/SecaoView.vue', () => ({ default: { template: '<div />' } }))

const ufs = [{ sg_uf: 'AC', total: 10, ate_1715: 5, pct_1715: 50, ate_1915: 9, pct_1915: 90, apos_1915: 1, pct_apos_1915: 10 }]
const municipios = [{ cd_municipio_tse: 1, nm_municipio: 'Rio Branco', total: 4, apos_1715: 2, pct_apos_1715: 50, partido: 'PT', votos: 100, pct_votos: 60 }]
const secoes = [{ id: 's1', nr_zona: 1, nr_secao: 7, dt_encerramento: '2022-10-02T20:30:00Z', apos_1715: true, partido: 'PT', votos: 80, pct_votos: 55 }]

describe('EncerramentoView', () => {
  it('ordena no servidor ao clicar no cabeçalho e navega UF → município → seção', async () => {
    api.encerramentoUrnas.mockResolvedValue({ ufs })
    api.encerramentoMunicipios.mockResolvedValue({ municipios })
    api.encerramentoSecoes.mockResolvedValue({ secoes })
    const w = await montar(EncerramentoView)

    expect(api.encerramentoMunicipios).not.toHaveBeenCalled()
    await w.findAll('thead button')[1].trigger('click')
    await flushPromises()
    expect(api.encerramentoUrnas.mock.calls.at(-1)[0]).toMatchObject({ ordem: 'total', direcao: 'asc' })
    await w.findAll('thead button')[1].trigger('click')
    await flushPromises()
    expect(api.encerramentoUrnas.mock.calls.at(-1)[0]).toMatchObject({ ordem: 'total', direcao: 'desc' })

    await w.find('tbody tr').trigger('click')
    await flushPromises()
    expect(api.encerramentoMunicipios.mock.calls.at(-1)[0]).toMatchObject({ uf: 'AC' })
    expect(w.text()).toContain('Rio Branco')

    await w.findAll('tbody tr')[1].trigger('click')
    await flushPromises()
    expect(api.encerramentoSecoes.mock.calls.at(-1)[0]).toMatchObject({ uf: 'AC', municipio: 1 })
    expect(w.text()).toContain('Sim')
  })
})
