import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CoberturaBlock from '../src/components/CoberturaBlock.vue'
import { definirLocale } from '../src/i18n'

afterEach(() => definirLocale('pt-BR'))

describe('CoberturaBlock', () => {
  const cobertura = { consideradas: 10, com_grupo: 4, campo_novo: 7 }

  it('traduz os campos conhecidos e mantém o nome bruto dos desconhecidos', async () => {
    const wrapper = mount(CoberturaBlock, { props: { cobertura } })
    const rotulos = () => wrapper.findAll('dt').map((item) => item.text())
    expect(rotulos()).toEqual(['Seções consideradas', 'Seções com grupo', 'campo_novo'])

    definirLocale('en-US')
    await nextTick()
    expect(rotulos()).toEqual(['Sections considered', 'Sections with group', 'campo_novo'])
  })

  it('formata números e mostra objetos aninhados como subitens rotulados, nunca como JSON', () => {
    const wrapper = mount(CoberturaBlock, {
      props: {
        cobertura: {
          consideradas: 1234567,
          sem_campo_por_regra: { comparecimento_vs_votos: 3000, comparecimento_vs_aptos: 0 },
          divergencias_por_regra: { biometria_vs_comparecimento: 12 },
        },
      },
    })
    const texto = wrapper.text()
    expect(texto).toContain('1.234.567')
    expect(texto).toContain('Sem campo por regra')
    expect(texto).toContain('Comparecimento vs. soma dos votos')
    expect(texto).toContain('3.000')
    expect(texto).not.toMatch(/[{}"]/)
    expect(wrapper.find('.painel-resumo').exists()).toBe(true)
    expect(wrapper.findAll('.cobertura-block__sub')).toHaveLength(2)
  })
})
