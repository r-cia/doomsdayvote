import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../src/api/client'
import SecaoView from '../src/views/SecaoView.vue'
import { ELEICAO, montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))

async function abrir() {
  api.secao.mockRejectedValue(new Error('falhou'))
  return montar(SecaoView, { props: { idProp: 's1', electionIdProp: ELEICAO, cargoProp: 1 } })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('SecaoView (modal)', () => {
  it('o botão do estado de erro fecha o modal', async () => {
    const w = await abrir()
    const botao = [...document.body.querySelectorAll('.state button')].find((b) => b.textContent.trim() === 'Fechar')
    expect(botao).toBeTruthy()
    botao.click()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('o botão ✕ e o clique no overlay fecham o modal', async () => {
    const w = await abrir()
    document.body.querySelector('.secao-modal__fechar').click()
    document.body.querySelector('.secao-modal__overlay').click()
    expect(w.emitted('close')).toHaveLength(2)
  })
})
