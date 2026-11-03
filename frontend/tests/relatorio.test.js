import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import RelatorioPanel from '../src/components/RelatorioPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))

const recebimento = { data_hora: 5, somente_data: 1, ausente: 0, outra_precisao: 0, sem_encerramento: 2, antes_encerramento: 0, antes_emissao: 0, mediana_atraso_min: 12, p90_atraso_min: 30 }
const eleicao = (ano, turno, id) => ({ election_id: id, ano_eleicao: ano, nr_turno: turno, bus: 10, participacao_pct: 80, abstencao_pct: 20, recebimento })

describe('RelatorioPanel', () => {
  it('mostra o alvo na primeira linha e as referências abaixo, com as duas tabelas', async () => {
    api.relatorio.mockResolvedValue({ alvo: eleicao(2022, 1), comparacao_final_disponivel: true, referencias: [eleicao(2018, 1, 'r1')] })
    const w = await montar(RelatorioPanel)
    const tabelas = w.findAll('table')
    expect(tabelas).toHaveLength(2)
    const linhas = tabelas[0].findAll('tbody tr')
    expect(linhas[0].text()).toContain('2022 · 1º turno (alvo)')
    expect(linhas[1].text()).toContain('2018')
    expect(tabelas[1].text()).toContain('Percentil 90 do atraso (min)')
  })

  it('com corte parcial não há referências', async () => {
    api.relatorio.mockResolvedValue({ alvo: eleicao(2022, 1), comparacao_final_disponivel: false, referencias: [eleicao(2018, 1, 'r1')] })
    const w = await montar(RelatorioPanel)
    expect(w.findAll('table')[0].findAll('tbody tr')).toHaveLength(1)
  })

  it('ordena no servidor com uma única ordenação para as duas tabelas', async () => {
    api.relatorio.mockResolvedValue({ alvo: eleicao(2022, 1), comparacao_final_disponivel: true, referencias: [] })
    const w = await montar(RelatorioPanel)
    await w.findAll('table')[1].findAll('thead button')[2].trigger('click')
    await flushPromises()
    expect(api.relatorio.mock.calls.at(-1)[0]).toMatchObject({ ordem: 'somente_data', direcao: 'asc' })
  })
})
