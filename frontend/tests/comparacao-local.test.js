import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import ComparacaoLocalPanel from '../src/components/ComparacaoLocalPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))
vi.mock('../src/views/SecaoView.vue', () => ({ default: { props: ['idProp'], template: '<div class="secao-modal-stub">{{ idProp }}</div>' } }))

const grupo = (chave, extra = {}) => ({
  chave, nivel: 'zona', tamanho: 12, dados_insuficientes: false,
  identificacao: { sg_uf: 'AC', cd_municipio_tse: 1, nm_municipio: 'Rio Branco', nr_zona: 1, nr_local_votacao: null },
  ...extra,
})
const secao = { secao: { id: 's1', nm_municipio: 'Rio Branco', nr_zona: 1, nr_secao: 9 }, metricas: { participacao: 0.8, abstencao: 0.2 }, distancia_pp: { participacao_pp: 1.5, abstencao_pp: -1.5 } }

describe('ComparacaoLocalPanel', () => {
  it('grupos começam recolhidos; expandir busca só as seções do grupo; selo de dados insuficientes', async () => {
    api.comparacaoLocal.mockResolvedValue({ cobertura: {}, page: 1, page_size: 50, total: 2, grupos: [grupo('zona:AC|1|1'), grupo('zona:AC|1|2', { dados_insuficientes: true, tamanho: 3 })] })
    api.comparacaoLocalSecoes.mockResolvedValue({ chave: 'zona:AC|1|1', secoes: [secao] })
    const w = await montar(ComparacaoLocalPanel)
    expect(api.comparacaoLocalSecoes).not.toHaveBeenCalled()
    expect(w.text()).toContain('Dados insuficientes')

    await w.findAll('button[aria-expanded]')[0].trigger('click')
    await flushPromises()
    expect(api.comparacaoLocalSecoes).toHaveBeenCalledTimes(1)
    expect(api.comparacaoLocalSecoes.mock.calls[0][0]).toMatchObject({ chave: 'zona:AC|1|1' })
    expect(w.text()).toContain('80,00%')
    expect(w.text()).toContain('1,5 pp')
  })

  it('o botão da seção abre o Boletim de Urna em modal, sem link', async () => {
    api.comparacaoLocal.mockResolvedValue({ cobertura: {}, page: 1, page_size: 50, total: 1, grupos: [grupo('zona:AC|1|1')] })
    api.comparacaoLocalSecoes.mockResolvedValue({ chave: 'zona:AC|1|1', secoes: [secao] })
    const w = await montar(ComparacaoLocalPanel)
    await w.find('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('.secao-modal-stub').exists()).toBe(false)
    await w.find('tbody button').trigger('click')
    expect(w.find('.secao-modal-stub').text()).toBe('s1')
  })

  it('ordena as seções no servidor', async () => {
    api.comparacaoLocal.mockResolvedValue({ cobertura: {}, page: 1, page_size: 50, total: 1, grupos: [grupo('zona:AC|1|1')] })
    api.comparacaoLocalSecoes.mockResolvedValue({ chave: 'zona:AC|1|1', secoes: [secao] })
    const w = await montar(ComparacaoLocalPanel)
    await w.find('button[aria-expanded]').trigger('click')
    await flushPromises()
    await w.findAll('thead button')[4].trigger('click')
    await flushPromises()
    expect(api.comparacaoLocalSecoes.mock.calls.at(-1)[0]).toMatchObject({ ordem: 'participacao', direcao: 'asc' })
  })
})
