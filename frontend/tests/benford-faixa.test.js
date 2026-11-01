import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BenfordFaixa from '../src/components/BenfordFaixa.vue'
import BenfordPanel from '../src/components/BenfordPanel.vue'

const digitos = (observado = 20) =>
  Array.from({ length: 9 }, (_, indice) => ({
    digito: indice + 1,
    observado: 10,
    observado_percentual: observado - indice,
    esperado_percentual: 30 - indice * 3,
  }))

const faixa = Array.from({ length: 9 }, (_, indice) => ({
  digito: indice + 1,
  p025: 30 - indice * 3 - 4,
  p975: 30 - indice * 3 + 4,
}))

const candidato = (monteCarlo) => ({
  nr_votavel: 13,
  nm_votavel: 'Candidato A',
  total_votos: 900,
  n: 120,
  secoes_abaixo_minimo: 3,
  mad: 0.004,
  classificacao: 'conformidade próxima',
  digitos: digitos(),
  monte_carlo: monteCarlo,
})

describe('BenfordFaixa', () => {
  it('desenha uma barra e uma faixa por dígito, a curva esperada e a legenda', () => {
    const wrapper = mount(BenfordFaixa, { props: { titulo: 'Benford', digitos: digitos(), faixa } })

    expect(wrapper.findAll('rect.benford-faixa__barra').filter((item) => item.attributes('x'))).toHaveLength(9)
    expect(wrapper.findAll('rect.benford-faixa__faixa').filter((item) => item.attributes('x'))).toHaveLength(9)
    expect(wrapper.find('path.benford-faixa__esperado').attributes('d').match(/[ML]/g)).toHaveLength(9)
    expect(wrapper.findAll('.benford-faixa__legenda li').map((item) => item.text())).toEqual([
      'Observado',
      'Esperado',
      'Faixa de 95% (Monte Carlo)',
    ])
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('faixa')
  })

  it('a faixa fica acima da base e cobre o valor esperado', () => {
    const wrapper = mount(BenfordFaixa, { props: { titulo: 'Benford', digitos: digitos(), faixa } })
    const faixas = wrapper.findAll('rect.benford-faixa__faixa').filter((item) => item.attributes('x'))
    for (const retangulo of faixas) {
      expect(Number(retangulo.attributes('height'))).toBeGreaterThan(0)
    }
    const primeira = faixas[0]
    const topo = Number(primeira.attributes('y'))
    const base = topo + Number(primeira.attributes('height'))
    const esperadoY = Number(wrapper.get('path.benford-faixa__esperado').attributes('d').split(/[ML]/)[1].split(' ')[1])
    expect(esperadoY).toBeGreaterThanOrEqual(topo)
    expect(esperadoY).toBeLessThanOrEqual(base)
  })

  it('sem faixa, omite a faixa e o item da legenda', () => {
    const wrapper = mount(BenfordFaixa, { props: { titulo: 'Benford', digitos: digitos(), faixa: null } })
    expect(wrapper.findAll('rect.benford-faixa__faixa').filter((item) => item.attributes('x'))).toHaveLength(0)
    expect(wrapper.findAll('.benford-faixa__legenda li')).toHaveLength(2)
  })
})

describe('BenfordPanel: gráfico por nível', () => {
  const dados = { minimo_votos: 10, candidatos: [candidato({ simulacoes: 10000, p_valor: 0.4, faixa_digitos: faixa })] }
  const niveis = {
    candidatos: [
      {
        nr_votavel: 13,
        niveis: {
          secao: candidato(null),
          zona: { ...candidato(null), digitos: digitos(25), monte_carlo: { faixa_digitos: faixa } },
          municipio: { ...candidato(null), digitos: digitos(30), monte_carlo: { faixa_digitos: null } },
        },
      },
    ],
  }

  it('começa na seção, troca de nível com o seletor e usa os dados de anomalias', async () => {
    const wrapper = mount(BenfordPanel, { props: { dados, niveis } })
    const botoes = wrapper.findAll('.segmented button')
    expect(botoes.map((botao) => botao.text())).toEqual(['Seção', 'Zona', 'Município'])
    expect(botoes[0].attributes('aria-pressed')).toBe('true')

    const alturaSecao = wrapper.findAll('rect.benford-faixa__barra')[0].attributes('height')
    await botoes[1].trigger('click')
    expect(botoes[1].attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('rect.benford-faixa__faixa').filter((item) => item.attributes('x'))).toHaveLength(9)
    expect(wrapper.findAll('rect.benford-faixa__barra')[0].attributes('height')).not.toBe(alturaSecao)

    await botoes[2].trigger('click')
    expect(wrapper.findAll('rect.benford-faixa__faixa').filter((item) => item.attributes('x'))).toHaveLength(0)
  })

  it('com erro nas anomalias, zona e município mostram o erro com nova tentativa e a seção segue no gráfico', async () => {
    const wrapper = mount(BenfordPanel, { props: { dados, niveis: null, niveisError: 'Falha ao consultar a API (500)' } })
    const botoes = wrapper.findAll('.segmented button')

    expect(wrapper.find('.benford__visual [role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('rect.benford-faixa__barra').length).toBeGreaterThan(0)

    await botoes[1].trigger('click')
    const alerta = wrapper.get('.benford__visual [role="alert"]')
    expect(alerta.text()).toContain('Falha ao consultar a API (500)')
    expect(wrapper.text()).not.toContain('Sem dados.')

    await alerta.get('button').trigger('click')
    expect(wrapper.emitted('retry-niveis')).toHaveLength(1)

    await botoes[2].trigger('click')
    expect(wrapper.get('.benford__visual [role="alert"]').exists()).toBe(true)
  })

  it('mostra carregando enquanto as anomalias não chegam e vazio quando não há nível', async () => {
    const carregando = mount(BenfordPanel, { props: { dados, niveis: null, niveisCarregando: true } })
    await carregando.findAll('.segmented button')[1].trigger('click')
    expect(carregando.find('[role="status"]').exists()).toBe(true)

    const vazio = mount(BenfordPanel, { props: { dados, niveis: null } })
    await vazio.findAll('.segmented button')[1].trigger('click')
    expect(vazio.text()).toContain('Sem dados.')
  })
})
