import { describe, expect, it } from 'vitest'
import router from '../src/router'

describe('roteador', () => {
  it.each(['painel', 'mapa', 'analise', 'biometria', 'comparacoes', 'relatorio', 'encerramento'])(
    '/%s tem rota própria',
    (nome) => {
      expect(router.resolve(`/${nome}`).name).toBe(nome)
    },
  )

  it('raiz e caminho desconhecido redirecionam para /painel', () => {
    expect(router.resolve('/').redirectedFrom).toBeUndefined()
    expect(router.resolve('/xyz').matched[0].redirect).toBe('/painel')
  })
})
