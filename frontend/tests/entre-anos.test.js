import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { api } from '../src/api/client'
import { coresPorCandidato, diferencasDoTurno, margemEsquerda, seriesDoTurno, tracoDoAno } from '../src/lib/entre-anos'
import EntreAnosPanel from '../src/components/EntreAnosPanel.vue'
import { montar } from './helpers'

vi.mock('../src/api/client', () => ({ api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn()) }) }))

const turno = (n, a, b) => ({
  turno: n,
  candidatos: [{ posicao: 1, nm_votavel: 'Beta' }, { posicao: 2, nm_votavel: 'Alfa' }],
  pontos: [
    { minuto: 1000, candidatos: [{ votos: a, pct_acumulada: 50 }, { votos: b, pct_acumulada: 50 }] },
    { minuto: 1005, candidatos: [{ votos: a + 1, pct_acumulada: 51 }, { votos: b + 1, pct_acumulada: 49 }] },
  ],
})
const resposta = {
  anos: [{ ano: 2018, turnos: [turno(1, 10, 5)] }, { ano: 2022, turnos: [turno(1, 20, 8)] }],
  pares: [{ ano_a: 2018, ano_b: 2022, turno: 1, posicao: 1, votos_intervalo: { r: 0.9, p_valor: 0.01 }, pct_acumulada: { r: 0.5, p_valor: 0.2 } }],
  avisos: [{ ano: 2014, codigo: 'SEM_HORARIO' }],
}

describe('lib/entre-anos', () => {
  it('cor por candidato em ordem alfabética e traço por ano', () => {
    const cores = coresPorCandidato(resposta)
    expect([...cores.keys()]).toEqual(['Alfa', 'Beta'])
    expect(tracoDoAno(resposta, 2018)).not.toBe(tracoDoAno(resposta, 2022))
    const series = seriesDoTurno(resposta, 1, 'votos')
    expect(series.find((s) => s.rotulo === '2018 · Alfa').cor).toBe(series.find((s) => s.rotulo === '2022 · Alfa').cor)
  })

  it('reserva margem pelo maior rótulo', () => {
    expect(margemEsquerda(['0', '207.952'])).toBeGreaterThan(margemEsquerda(['0', '10']))
    expect(margemEsquerda(['207.952'])).toBeGreaterThanOrEqual(7 * 6)
  })

  it('diferença só nos minutos presentes nos dois anos', () => {
    const [dif] = diferencasDoTurno(resposta, 1, 'votos')
    expect(dif.pontos).toEqual([{ x: 1000, y: -10 }, { x: 1005, y: -10 }])
  })
})

describe('EntreAnosPanel', () => {
  const eleicoes = [
    { id: 'e1', ano_eleicao: 2018, nr_turno: 1, dt_pleito: '2018-10-07', cargos: [{ cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' }] },
    { id: 'e2', ano_eleicao: 2022, nr_turno: 1, dt_pleito: '2022-10-02', cargos: [{ cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' }] },
    { id: 'e3', ano_eleicao: 2014, nr_turno: 1, dt_pleito: null, cargos: [{ cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' }] },
  ]

  it('só consulta com dois anos, desabilita ano sem data e navega turnos pelo teclado', async () => {
    api.comparacaoAnos.mockResolvedValue({ ...resposta, anos: [{ ano: 2018, turnos: [turno(1, 10, 5), turno(2, 10, 5)] }, { ano: 2022, turnos: [turno(1, 20, 8), turno(2, 20, 8)] }] })
    api.eleicoes.mockResolvedValue({ eleicoes })
    const w = await montar(EntreAnosPanel, { filtros: { electionId: null, cargo: null } })
    await flushPromises()
    const botoes = w.findAll('.segmented button')
    expect(botoes.map((b) => b.attributes('disabled') !== undefined)).toEqual([true, false, false])
    await botoes[1].trigger('click')
    expect(api.comparacaoAnos).not.toHaveBeenCalled()
    await botoes[2].trigger('click')
    await flushPromises()
    expect(api.comparacaoAnos.mock.calls.at(-1)[0]).toMatchObject({ anos: '2018,2022' })
    expect(w.text()).toContain('0,900')
    expect(w.text()).toContain('0,0100')
    const abas = w.find('[role="tablist"]')
    await abas.trigger('keydown', { key: 'ArrowRight' })
    expect(w.findAll('[role="tab"]')[1].attributes('aria-selected')).toBe('true')
    await abas.trigger('keydown', { key: 'Home' })
    expect(w.findAll('[role="tab"]')[0].attributes('aria-selected')).toBe('true')
  })
})
