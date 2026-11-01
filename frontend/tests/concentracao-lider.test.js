import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConcentracaoPanel from '../src/components/ConcentracaoPanel.vue'

const item = (id, lider) => ({
  secao: { id, sg_uf: 'AC', nm_municipio: 'RIO BRANCO', cd_municipio_tse: 1392, nr_zona: 1, nr_secao: id },
  share_lider: 0.6,
  margem_absoluta: 50,
  margem_pp: 20,
  contexto: { share_lider_percentil: 90 },
  lider,
})

describe('ConcentracaoPanel', () => {
  it('mostra o candidato líder como última coluna das duas tabelas, e travessão sem líder', () => {
    const dados = {
      top_share: [item(1, { nm_votavel: 'CANDIDATA A' }), item(2, null)],
      top_margem: [item(3, { nm_votavel: 'CANDIDATO B' })],
      cobertura: {},
    }
    const wrapper = mount(ConcentracaoPanel, { props: { dados } })
    const tabelas = wrapper.findAll('table')
    expect(tabelas).toHaveLength(2)

    for (const tabela of tabelas) {
      const cabecalhos = tabela.findAll('thead th')
      expect(cabecalhos.at(-1).text()).toBe('Candidato')
      expect(cabecalhos.at(-1).find('button').exists()).toBe(false)
    }

    const [porShare, porMargem] = tabelas
    const ultimaCelula = (linha) => linha.findAll('td').at(-1).text()
    const linhasShare = porShare.findAll('tbody tr')
    expect(ultimaCelula(linhasShare[0])).toBe('CANDIDATA A')
    expect(ultimaCelula(linhasShare[1])).toBe('—')
    expect(ultimaCelula(porMargem.findAll('tbody tr')[0])).toBe('CANDIDATO B')
  })
})
