import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import SecoesDestaquePanel from '../src/components/SecoesDestaquePanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))
vi.mock('../src/views/SecaoView.vue', () => ({ default: { props: ['idProp'], template: '<div class="secao-modal-stub">{{ idProp }}</div>' } }))

const consistencia = {
  cobertura: { consideradas: 10, avaliadas: 9, com_divergencia: 2, sem_divergencia: 7 },
  page: 1, page_size: 50, total: 1,
  itens: [{ secao: { id: 's1', sg_uf: 'AC', cd_municipio_tse: 1, nm_municipio: 'Rio Branco', nr_zona: 1, nr_secao: 5 }, regra: 'comparecimento_vs_aptos', diferenca: -3 }],
}
const secao = { id: 's2', sg_uf: 'AC', cd_municipio_tse: 1, nm_municipio: 'Rio Branco', nr_zona: 1, nr_secao: 6 }
const item = { secao, share_lider: 0.8, margem_absoluta: 50, margem_pp: 40, lider: { nm_votavel: 'Fulano', sg_partido: 'PT' }, contexto: { share_lider_percentil: 90 } }
const concentracao = {
  cobertura: { consideradas: 10, com_contexto: 8, sem_contexto: 2, grupos: 3, grupos_insuficientes: 1, faixas_aptos: 2 },
  page: 1, page_size: 50, total: 1, top_share: [item], top_margem: [item],
}

async function abrir(rotulo) {
  api.consistencia.mockResolvedValue(consistencia)
  api.concentracao.mockResolvedValue(concentracao)
  const w = await montar(SecoesDestaquePanel)
  await w.findAll('.segmented button').find((b) => b.text() === rotulo).trigger('click')
  await flushPromises()
  return w
}

describe('SecoesDestaquePanel', () => {
  it('oferece as quatro visões', async () => {
    const w = await montar(SecoesDestaquePanel)
    expect(w.findAll('.segmented button').map((b) => b.text())).toEqual(['Outliers', 'Participação do líder', 'Margem', 'Consistência aritmética'])
  })

  it('consistência: ordena no servidor, filtra por regra e abre a seção correta', async () => {
    const w = await abrir('Consistência aritmética')
    expect(w.text()).toContain('Comparecimento × aptos')
    expect(w.text()).toContain('2 com divergência')
    expect(w.text()).toContain('AC')
    expect(w.text()).toContain('Rio Branco')
    expect(w.find('a').exists()).toBe(false)
    await w.find('tbody button').trigger('click')
    expect(w.find('.secao-modal-stub').text()).toBe('s1')
    await w.findAll('thead button').at(5).trigger('click')
    await flushPromises()
    expect(api.consistencia.mock.calls.at(-1)[0]).toMatchObject({ ordem: 'diferenca', direcao: 'asc' })
    await w.find('select').setValue('comparecimento_vs_aptos')
    await flushPromises()
    expect(api.consistencia.mock.calls.at(-1)[0]).toMatchObject({ regra: 'comparecimento_vs_aptos', page: 1 })
  })

  it('participação do líder e margem têm ordenação própria e mostram a cobertura', async () => {
    const w = await abrir('Participação do líder')
    expect(w.text()).toContain('3 grupos')
    expect(w.text()).toContain('80,00%')
    await w.findAll('thead button').at(4).trigger('click')
    await flushPromises()
    expect(api.concentracao.mock.calls.at(-1)[0]).toMatchObject({ ordem_share: 'share_lider', direcao_share: 'asc' })
    expect(api.concentracao.mock.calls.at(-1)[0]).not.toHaveProperty('ordem_margem')
    await w.findAll('.segmented button').find((b) => b.text() === 'Margem').trigger('click')
    await flushPromises()
    await w.findAll('thead button').at(0).trigger('click')
    await flushPromises()
    expect(api.concentracao.mock.calls.at(-1)[0]).toMatchObject({ ordem_share: 'share_lider', ordem_margem: 'sg_uf' })
  })
})
