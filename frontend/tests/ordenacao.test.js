import { describe, expect, it } from 'vitest'
import { useOrdenacao } from '../src/composables/ordenacao'

describe('useOrdenacao', () => {
  it('começa sem ordem, sem seta e sem parâmetros', () => {
    const o = useOrdenacao()
    expect(o.coluna.value).toBeNull()
    expect(o.params.value).toEqual({})
    expect(o.ariaSort('nm')).toBe('none')
    expect(o.seta('nm')).toBe('')
  })

  it('alterna a direção na mesma coluna e reinicia em asc ao trocar de coluna', () => {
    const o = useOrdenacao()
    o.alternar('nm')
    expect(o.params.value).toEqual({ ordem: 'nm', direcao: 'asc' })
    expect(o.ariaSort('nm')).toBe('ascending')
    expect(o.seta('nm')).toBe(' ↑')

    o.alternar('nm')
    expect(o.params.value).toEqual({ ordem: 'nm', direcao: 'desc' })
    expect(o.ariaSort('nm')).toBe('descending')
    expect(o.seta('nm')).toBe(' ↓')

    o.alternar('qt')
    expect(o.params.value).toEqual({ ordem: 'qt', direcao: 'asc' })
    expect(o.ariaSort('nm')).toBe('none')
  })

  it('aplica o sufixo aos parâmetros', () => {
    const o = useOrdenacao('duplicacao')
    o.alternar('secoes')
    expect(o.params.value).toEqual({ ordem_duplicacao: 'secoes', direcao_duplicacao: 'asc' })
  })
})
