import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import DivergenciasPanel from '../src/components/DivergenciasPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))

const item = { id: 1, fonte: 'rdv', campo: 'qt_votos', sg_uf: 'AC', cd_municipio_tse: 1, nr_zona: 2, nr_secao: 3, cd_cargo_pergunta: 1, nr_votavel: 13, valor_esperado: '10', valor_encontrado: null }

describe('DivergenciasPanel', () => {
  it('lista todas as fontes por padrão e mostra nulo como travessão', async () => {
    api.totalizacaoDivergencias.mockResolvedValue({ itens: [item], total: 1, pagina: 1, tamanho: 25 })
    const w = await montar(DivergenciasPanel)
    expect(api.totalizacaoDivergencias.mock.calls.at(-1)[0].fonte).toBe('')
    expect(w.text()).toContain('AC · 1 · zona 2 · seção 3')
    expect(w.findAll('tbody td').at(-1).text()).toBe('—')
  })

  it('filtra por fonte e volta à página 1', async () => {
    api.totalizacaoDivergencias.mockResolvedValue({ itens: [item], total: 60, pagina: 1, tamanho: 25 })
    const w = await montar(DivergenciasPanel)
    await w.find('button[aria-label="Próxima página"]').trigger('click')
    await flushPromises()
    expect(api.totalizacaoDivergencias.mock.calls.at(-1)[0].pagina).toBe(2)
    await w.find('select').setValue('log')
    await flushPromises()
    expect(api.totalizacaoDivergencias.mock.calls.at(-1)[0]).toMatchObject({ fonte: 'log', pagina: 1 })
  })

  it('mostra a mensagem de vazio', async () => {
    api.totalizacaoDivergencias.mockResolvedValue({ itens: [], total: 0 })
    const w = await montar(DivergenciasPanel)
    expect(w.text()).toContain('Nenhuma divergência de dupla conferência neste recorte.')
  })

  it('durante a recarga com linhas já exibidas marca a tabela como ocupada e avisa leitores de tela', async () => {
    api.totalizacaoDivergencias.mockResolvedValueOnce({ itens: [item], total: 60, pagina: 1, tamanho: 25 })
    const w = await montar(DivergenciasPanel)
    api.totalizacaoDivergencias.mockReturnValueOnce(new Promise(() => {}))
    await w.find('button[aria-label="Próxima página"]').trigger('click')
    await flushPromises()
    const tabela = w.find('.tabela-scroll')
    expect(tabela.classes()).toContain('atualizando')
    expect(tabela.attributes('aria-busy')).toBe('true')
    expect(tabela.find('[role="status"]').text()).toBe('Carregando…')
    expect(w.find('tbody tr').exists()).toBe(true)
  })
})
