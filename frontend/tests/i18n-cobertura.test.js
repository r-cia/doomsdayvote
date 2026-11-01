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
})
