import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CurvasAnos from '../src/components/CurvasAnos.vue'

describe('CurvasAnos', () => {
  const series = [
    {
      chave: '2018',
      rotulo: '2018 · A',
      pontos: [
        { minuto: 1020, valor: 10 },
        { minuto: 1025, valor: 30 },
      ],
    },
    {
      chave: '2022',
      rotulo: '2022 · B',
      pontos: [
        { minuto: 1020, valor: 20 },
        { minuto: 1025, valor: null },
      ],
    },
  ]

  it('desenha uma curva e uma entrada de legenda por série', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 'Votos por intervalo', series } })

    expect(wrapper.findAll('path')).toHaveLength(2)
    expect(wrapper.findAll('.curvas__legenda li').map((item) => item.text())).toEqual(['2018 · A', '2022 · B'])
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('Votos por intervalo')
  })

  it('ignora pontos nulos no traçado', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 't', series } })

    expect(wrapper.findAll('path')[1].attributes('d').match(/L/g)).toBeNull()
  })

  it('mostra as horas no eixo a partir dos minutos desde 00:00', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 't', series } })

    expect(wrapper.text()).toContain('17:00')
  })
})
