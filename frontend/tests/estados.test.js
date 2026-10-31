import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BenfordPanel from '../src/components/BenfordPanel.vue'
import MapTable from '../src/components/MapTable.vue'
import PlotDia from '../src/components/PlotDia.vue'

const SEM_DADOS = 'Sem dados.'

describe('estados: carregando, erro, sem dados, dados', () => {
  it('BenfordPanel mostra o erro e não "Sem dados"; resposta vazia bem-sucedida mostra "Sem dados"', async () => {
    const comErro = mount(BenfordPanel, { props: { dados: null, error: 'Falha ao consultar a API (500)' } })
    expect(comErro.find('[role="alert"]').exists()).toBe(true)
    expect(comErro.text()).toContain('Falha ao consultar a API (500)')
    expect(comErro.text()).not.toContain(SEM_DADOS)

    await comErro.get('[role="alert"] button').trigger('click')
    expect(comErro.emitted('retry')).toHaveLength(1)

    const vazio = mount(BenfordPanel, { props: { dados: { candidatos: [], minimo_votos: 10 } } })
    expect(vazio.find('[role="alert"]').exists()).toBe(false)
    expect(vazio.text()).toContain(SEM_DADOS)
  })

  it('BenfordPanel mostra o erro no lugar de dados antigos', () => {
    const wrapper = mount(BenfordPanel, {
      props: {
        dados: { minimo_votos: 10, candidatos: [{ nr_votavel: 13, nm_votavel: 'A', n: 10, mad: 0.01, digitos: [] }] },
        error: 'Falha',
      },
    })

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('.benford').exists()).toBe(false)
  })

  it('MapTable mostra o erro e não "Sem dados"; sem linhas bem-sucedido mostra "Sem dados"', async () => {
    const comErro = mount(MapTable, { props: { areas: [], error: 'Falha ao consultar a API (503)' } })
    expect(comErro.find('[role="alert"]').exists()).toBe(true)
    expect(comErro.text()).not.toContain(SEM_DADOS)

    await comErro.get('[role="alert"] button').trigger('click')
    expect(comErro.emitted('retry')).toHaveLength(1)

    const carregando = mount(MapTable, { props: { areas: [], loading: true } })
    expect(carregando.text()).not.toContain(SEM_DADOS)

    const vazio = mount(MapTable, { props: { areas: [] } })
    expect(vazio.find('[role="alert"]').exists()).toBe(false)
    expect(vazio.text()).toContain(SEM_DADOS)
  })

  it('PlotDia mostra o erro em vez de "linha do tempo indisponível"', async () => {
    const comErro = mount(PlotDia, { props: { pontos: [], series: [], error: 'Falha ao consultar a API (500)' } })
    expect(comErro.find('[role="alert"]').exists()).toBe(true)
    expect(comErro.text()).not.toContain('Linha do tempo indisponível')

    await comErro.get('[role="alert"] button').trigger('click')
    expect(comErro.emitted('retry')).toHaveLength(1)

    const vazio = mount(PlotDia, { props: { pontos: [], series: [] } })
    expect(vazio.text()).toContain('Linha do tempo indisponível')
  })
})
