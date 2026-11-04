import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlotDia from '../src/components/PlotDia.vue'

describe('PlotDia', () => {
  it('marca 5 min por padrão e emite 1m ao escolher 1 min', async () => {
    const wrapper = mount(PlotDia)
    const [cinco, um] = wrapper.findAll('.segmented button')
    expect(cinco.attributes('aria-pressed')).toBe('true')
    await um.trigger('click')
    expect(wrapper.emitted('update:granularidade')[0]).toEqual(['1m'])
  })
})

describe('PlotDia: clique no traçado', () => {
  it('clicar no traçado emite update:corte com o ponto mais próximo', async () => {
    const ctx = new Proxy({}, { get: () => () => ({ width: 0 }), set: () => true })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1050, height: 200 })
    const pontos = ['2022-10-02T20:00:00Z', '2022-10-02T21:00:00Z', '2022-10-02T22:00:00Z'].map((t, i) => ({
      t,
      votos_acumulados: 10 * (i + 1),
      secoes_com_bu_acumuladas: i + 1,
    }))
    const wrapper = mount(PlotDia, { props: { pontos, series: [] }, attachTo: document.body })
    wrapper.find('canvas').element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 1040, bubbles: true }))
    expect(wrapper.emitted('update:corte').at(-1)[0]).toBe('2022-10-02T19:00')
  })
})
