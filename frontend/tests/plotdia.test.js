import { describe, expect, it } from 'vitest'
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
