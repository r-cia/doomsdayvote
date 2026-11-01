import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import KpiCards from '../src/components/KpiCards.vue'
import i18n, { definirLocale } from '../src/i18n'
import {
  formatarData,
  formatarDataHora,
  formatarDecimal,
  formatarHora,
  formatarNumero,
  formatarPercentual,
} from '../src/lib/format'

afterEach(() => definirLocale('pt-BR'))

const ISO = '2026-10-04T20:08:45Z'

describe('formatação segue o idioma selecionado', () => {
  it('números, decimais e percentuais usam o locale ativo', () => {
    definirLocale('pt-BR')
    expect(formatarNumero(1234567.5)).toBe('1.234.567,5')
    expect(formatarPercentual(12.345)).toBe('12,35%')
    expect(formatarDecimal(0.5, 2)).toBe('0,50')

    definirLocale('en-US')
    expect(formatarNumero(1234567.5)).toBe('1,234,567.5')
    expect(formatarPercentual(12.345)).toBe('12.35%')
    expect(formatarDecimal(0.5, 2)).toBe('0.50')

    definirLocale('es-ES')
    expect(formatarNumero(1234567.5)).toBe('1.234.567,5')
    expect(formatarPercentual(12.345)).toBe('12,35%')
  })

  it('datas e horas seguem o idioma e mantêm o fuso de São Paulo', () => {
    definirLocale('pt-BR')
    expect(formatarHora(ISO)).toBe('17:08')
    expect(formatarData(ISO)).toBe('04/10/2026')
    expect(formatarDataHora(ISO)).toContain('04/10/2026')

    definirLocale('en-US')
    expect(formatarHora(ISO)).toBe('17:08')
    expect(formatarData(ISO)).toBe('10/4/26')
    expect(formatarDataHora(ISO)).toContain('10/4/26')

    definirLocale('es-ES')
    expect(formatarHora(ISO)).toBe('17:08')
    expect(formatarData(ISO)).toBe('4/10/26')
  })

  it('um componente renderizado refaz os números e textos ao trocar o idioma', async () => {
    const resumo = { metricas: { qt_comparecimento: 1234567, qt_aptos: 2000000, bus_considerados: 1200 }, votos: [] }
    const wrapper = mount(KpiCards, { props: { resumo, candidato: null } })
    expect(wrapper.text()).toContain('1.234.567')
    expect(wrapper.text()).toContain('dos aptos')

    definirLocale('en-US')
    await nextTick()
    expect(wrapper.text()).toContain('1,234,567')
    expect(wrapper.text()).toContain('of eligible voters')
  })
})

describe('<html lang> e título do documento', () => {
  it('acompanham o idioma selecionado', async () => {
    definirLocale('en-US')
    await nextTick()
    expect(document.documentElement.lang).toBe('en-US')
    expect(document.title).toBe(i18n.global.t('app.tituloDocumento'))

    definirLocale('es-ES')
    await nextTick()
    expect(document.documentElement.lang).toBe('es-ES')
    expect(document.title).toBe('Doomsday Vote · Auditoría de BU')

    definirLocale('pt-BR')
    await nextTick()
    expect(document.documentElement.lang).toBe('pt-BR')
  })
})
