import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BenfordPanel from '../src/components/BenfordPanel.vue'

const digitos = (n) => Array.from({ length: 9 }, (_, i) => ({ digito: i + 1, observado: n, observado_percentual: 10 + i, esperado_percentual: 30 - 3 * i }))
const faixa = Array.from({ length: 9 }, (_, i) => ({ digito: i + 1, p025: 5 + i, p975: 15 + i }))
const nivel = (n, comFaixa) => ({ n, mad: 0.01, monte_carlo: { p_valor: 0.5, faixa_digitos: comFaixa ? faixa : null }, digitos: digitos(n) })

const dados = { minimo_votos: 10, candidatos: [{ nr_votavel: 13, nm_votavel: 'Fulano', ...nivel(100, true) }] }
const niveis = {
  candidatos: [
    { nr_votavel: 13, nm_votavel: 'Fulano', niveis: { secao: nivel(100, true), zona: nivel(0, false), municipio: nivel(50, true) } },
  ],
}

describe('BenfordPanel', () => {
  it('desenha a faixa de 95% por dígito e a legenda quando existe', () => {
    const w = mount(BenfordPanel, { props: { dados, niveis } })
    expect(w.findAll('.benford-faixa__svg .benford-faixa__faixa')).toHaveLength(9)
    expect(w.text()).toContain('Faixa de 95% (Monte Carlo)')
    expect(w.text()).toContain('Observado')
    expect(w.text()).toContain('Esperado')
    expect(w.find('rect.benford-faixa__barra title').text()).toContain('faixa de 95%')
  })

  it('sem faixa nada da faixa é desenhado', () => {
    const semFaixa = { minimo_votos: 10, candidatos: [{ nr_votavel: 13, nm_votavel: 'Fulano', ...nivel(100, false) }] }
    const w = mount(BenfordPanel, { props: { dados: semFaixa } })
    expect(w.findAll('.benford-faixa__faixa')).toHaveLength(0)
    expect(w.text()).not.toContain('Faixa de 95%')
  })

  it('seletor troca de nível sem nova requisição e mostra Sem dados quando n = 0', async () => {
    const w = mount(BenfordPanel, { props: { dados, niveis } })
    const botoes = w.findAll('.segmented button')
    expect(botoes.map((b) => b.text())).toEqual(['Seção', 'Zona', 'Município'])
    await botoes[1].trigger('click')
    expect(w.text()).toContain('Sem dados')
    expect(botoes[1].attributes('aria-pressed')).toBe('true')
    await botoes[2].trigger('click')
    expect(w.findAll('.benford-faixa__svg .benford-faixa__faixa')).toHaveLength(9)
  })

  it('zona ou município enquanto as anomalias carregam mostram carregando', async () => {
    const w = mount(BenfordPanel, { props: { dados, niveis: null, carregandoNiveis: true } })
    await w.findAll('.segmented button')[1].trigger('click')
    expect(w.text()).toContain('Carregando')
  })
})
