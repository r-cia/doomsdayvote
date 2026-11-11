import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlotDia from '../src/components/PlotDia.vue'
import { paraInputSaoPaulo } from '../src/lib/format'

function criarContexto() {
  const chamadas = []
  const ctx = new Proxy(
    {},
    {
      get: (_, propriedade) => (...args) => {
        chamadas.push([propriedade, ...args])
        return { width: 10 }
      },
      set: () => true,
    },
  )
  return { ctx, chamadas }
}

function montarCom(props) {
  const { ctx, chamadas } = criarContexto()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const wrapper = mount(PlotDia, { props, attachTo: document.body })
  return { wrapper, chamadas }
}

describe('PlotDia: desenho do traçado', () => {
  it('desenha eixos em milhões, séries e o marcador do líder', () => {
    const pontos = [
      { t: '2022-10-02T20:00:00.000Z', votos_acumulados: 1000000, secoes_com_bu_acumuladas: 10 },
      { t: '2022-10-04T14:00:00.000Z', votos_acumulados: 2000000, secoes_com_bu_acumuladas: 20 },
      { t: '2022-10-04T20:00:00.000Z', votos_acumulados: 2500000, secoes_com_bu_acumuladas: 30 },
    ]
    const series = [
      {
        nr_votavel: 13,
        pontos: [
          { t: '2022-10-02T20:00:00.000Z', votos_acumulados: 1000000 },
          { t: '2022-10-04T20:00:00.000Z', votos_acumulados: 2500000 },
        ],
      },
      { nr_votavel: 45, pontos: [] },
    ]

    const { wrapper, chamadas } = montarCom({
      pontos,
      series,
      candidatos: [
        { nr_votavel: 13, sg_partido: 'PT' },
        { nr_votavel: 45, sg_partido: 'PSDB' },
      ],
      candidato: 13,
      corte: '2022-10-04T15:00:00.000Z',
    })

    const metodos = chamadas.map(([metodo]) => metodo)
    expect(metodos).toContain('fillText')
    expect(metodos).toContain('setLineDash')
    expect(metodos).toContain('arc')
    expect(chamadas.some(([metodo, valor]) => metodo === 'fillText' && String(valor).endsWith('M'))).toBe(true)
    expect(wrapper.find('input[type="range"]').element.value).toBe('1')
    expect(wrapper.find('canvas').attributes('aria-label')).toContain('2.500.000')
  })

  it('usa eixo sem sufixo, aceita corte inválido e não desenha líder sem série', async () => {
    const pontos = [
      { t: '2022-10-02T20:00:00.000Z', votos_acumulados: 500, secoes_com_bu_acumuladas: 1 },
      { t: '2022-10-02T21:00:00.000Z', votos_acumulados: 900, secoes_com_bu_acumuladas: 2 },
    ]

    const { wrapper, chamadas } = montarCom({ pontos, series: [], corte: 'data-invalida' })

    const textos = chamadas.filter(([metodo]) => metodo === 'fillText').map(([, valor]) => String(valor))
    expect(textos).toContain('0')
    expect(textos).toContain('900')
    expect(chamadas.some(([metodo]) => metodo === 'arc')).toBe(false)
    expect(wrapper.find('input[type="range"]').element.value).toBe('1')

    const entrada = wrapper.find('input[type="range"]')
    entrada.element.value = '0'
    await entrada.trigger('input')
    expect(wrapper.emitted('update:corte').at(-1)[0]).toBe(paraInputSaoPaulo(pontos[0].t))
  })

  it('emite o corte ao arrastar e ao mover o cursor até a borda direita', async () => {
    const pontos = [
      { t: '2022-10-02T20:00:00.000Z', votos_acumulados: 10, secoes_com_bu_acumuladas: 1 },
      { t: '2022-10-02T21:00:00.000Z', votos_acumulados: 20, secoes_com_bu_acumuladas: 2 },
      { t: '2022-10-02T22:00:00.000Z', votos_acumulados: 30, secoes_com_bu_acumuladas: 3 },
    ]
    const { wrapper } = montarCom({ pontos, series: [] })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1050,
      height: 200,
    })

    const canvas = wrapper.find('canvas')
    canvas.element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 1040, bubbles: true }))
    canvas.element.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, bubbles: true }))
    canvas.element.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    await wrapper.vm.$nextTick()

    const cortes = wrapper.emitted('update:corte').map(([valor]) => valor)
    expect(cortes).toContain(paraInputSaoPaulo(pontos[2].t))
    expect(cortes).toContain(paraInputSaoPaulo(pontos[0].t))
  })

  it('mostra a mensagem de aviso quando não há pontos', () => {
    const { wrapper } = montarCom({
      pontos: [],
      series: [],
      avisos: [{ mensagem: 'sem horário de recebimento' }],
    })

    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(wrapper.text()).toContain('sem horário de recebimento')
  })
})
