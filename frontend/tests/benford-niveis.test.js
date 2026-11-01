import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BenfordNiveisPanel from '../src/components/BenfordNiveisPanel.vue'

const nivel = (n, p) => ({ n, mad: 0.0123, monte_carlo: { simulacoes: 10000, p_valor: p, faixa_digitos: null } })

describe('BenfordNiveisPanel', () => {
  const dados = {
    candidatos: [
      {
        nr_votavel: 13,
        nm_votavel: 'Candidato A',
        niveis: { secao: nivel(496710, 0.0123), zona: nivel(2900, 0.4), municipio: nivel(5570, 1) },
      },
    ],
  }

  it('mostra o p-valor de cada nível formatado como na tabela de Benford e os n com separador de milhar', () => {
    const wrapper = mount(BenfordNiveisPanel, { props: { dados } })
    const celulas = wrapper.findAll('tbody td').map((celula) => celula.text())

    expect(celulas).toEqual([
      'Candidato A',
      '496.710', '0,0123', '0,0123',
      '2.900', '0,0123', '0,4000',
      '5.570', '0,0123', '1,0000',
    ])
  })

  it('usa um título próprio, diferente do painel Benford', () => {
    const wrapper = mount(BenfordNiveisPanel, { props: { dados } })
    expect(wrapper.get('h2').text()).toBe('Benford por níveis')
  })

  it('mostra travessão quando o p-valor não existe', () => {
    const semP = { candidatos: [{ ...dados.candidatos[0], niveis: { secao: { n: 5, mad: 0.01 }, zona: { n: 5, mad: 0.01 }, municipio: { n: 5, mad: 0.01 } } }] }
    const wrapper = mount(BenfordNiveisPanel, { props: { dados: semP } })
    expect(wrapper.findAll('tbody td').map((celula) => celula.text())[3]).toBe('—')
  })
})
