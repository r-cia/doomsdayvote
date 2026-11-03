import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import VersoesBoletimPanel from '../src/components/VersoesBoletimPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))

const v = (versao, ativo) => ({ id: `v${versao}`, versao, ativo, qt_aptos: 100, conteudo_sha256: 'abcdef0123456789' })
const resposta = {
  versoes: [v(1, false), v(2, false), v(3, true)],
  comparacao: {
    anterior: 2, atual: 3,
    campos_alterados: [{ campo: 'qt_aptos', anterior: 100, atual: 110, diferenca: 10 }],
    votaveis_alterados: [{ nr_votavel: 13, nm_votavel: 'Fulano', anterior: 5, atual: 7, diferenca: 2 }],
  },
}

describe('VersoesBoletimPanel', () => {
  it('marca a ativa, compara com a anterior por padrão e com a escolhida quando informada', async () => {
    api.secaoVersoes.mockResolvedValue(resposta)
    const w = await montar(VersoesBoletimPanel, { props: { secaoId: 's1' } })
    expect(w.text()).toContain('Ativa')
    expect(api.secaoVersoes.mock.calls.at(-1)[0]).toBe('s1')
    expect(api.secaoVersoes.mock.calls.at(-1)[1]).not.toHaveProperty('comparar_com', 1)
    expect(w.text()).toContain('qt_aptos')
    await w.find('select').setValue(1)
    await flushPromises()
    expect(api.secaoVersoes.mock.calls.at(-1)[1]).toMatchObject({ comparar_com: 1 })
  })

  it('as duas tabelas ordenam de forma independente', async () => {
    api.secaoVersoes.mockResolvedValue(resposta)
    const w = await montar(VersoesBoletimPanel, { props: { secaoId: 's1' } })
    const botoes = w.findAll('thead button')
    await botoes[0].trigger('click')
    await flushPromises()
    expect(api.secaoVersoes.mock.calls.at(-1)[1]).toMatchObject({ ordem_campos: 'campo' })
    expect(api.secaoVersoes.mock.calls.at(-1)[1]).not.toHaveProperty('ordem_votaveis')
    await botoes[4].trigger('click')
    await flushPromises()
    expect(api.secaoVersoes.mock.calls.at(-1)[1]).toMatchObject({ ordem_campos: 'campo', ordem_votaveis: 'nr_votavel' })
  })

  it('sem versão anterior mostra a mensagem', async () => {
    api.secaoVersoes.mockResolvedValue({ versoes: [v(1, true)], comparacao: null })
    const w = await montar(VersoesBoletimPanel, { props: { secaoId: 's1' } })
    expect(w.text()).toContain('Não há versão anterior para comparar.')
  })
})
