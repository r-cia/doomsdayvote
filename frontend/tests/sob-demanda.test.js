import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ExibirSobDemanda from '../src/components/ExibirSobDemanda.vue'
import Cobertura from '../src/components/Cobertura.vue'

describe('ExibirSobDemanda', () => {
  it('só renderiza o conteúdo (e portanto só consulta) quando o bloco entra na tela', async () => {
    let aoObservar
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback) {
          aoObservar = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const montado = vi.fn()
    const Filho = defineComponent({ setup: () => { montado(); return () => h('p', 'conteúdo') } })
    const wrapper = mount(ExibirSobDemanda, { slots: { default: () => h(Filho) } })
    expect(montado).not.toHaveBeenCalled()
    aoObservar([{ isIntersecting: true }])
    await wrapper.vm.$nextTick()
    expect(montado).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('conteúdo')
  })
})

describe('Cobertura', () => {
  it('mostra rótulos e valores', () => {
    const wrapper = mount(Cobertura, { props: { itens: [{ rotulo: 'Seções consideradas', valor: '10' }] } })
    expect(wrapper.text()).toContain('Seções consideradas')
    expect(wrapper.text()).toContain('10')
  })
})
