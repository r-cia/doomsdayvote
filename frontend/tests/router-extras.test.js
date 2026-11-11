import { describe, expect, it } from 'vitest'
import router from '../src/router'

describe('roteador: redirecionamentos e rolagem', () => {
  it('redireciona /auditoria e caminhos desconhecidos para o painel', () => {
    expect(router.resolve('/auditoria').matched[0].redirect).toBe('/painel')
    expect(router.resolve('/qualquer/coisa').matched[0].redirect).toBe('/painel')
  })

  it('volta ao topo em cada navegação', () => {
    expect(router.options.scrollBehavior()).toEqual({ top: 0 })
  })
})
