import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFiltersStore } from '../src/stores/filters'

const eleicoes = [
  {
    id: 'e1',
    ano_eleicao: 2022,
    nr_turno: 1,
    cargos: [
      { cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' },
      { cd_cargo_pergunta: 3, ds_cargo_pergunta: 'Governador' },
    ],
  },
  {
    id: 'e2',
    ano_eleicao: 2022,
    nr_turno: 2,
    cargos: [{ cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' }],
  },
]

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('filters store', () => {
  it('inicializa com a primeira eleição e Presidente', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    expect(store.electionId).toBe('e1')
    expect(store.turno).toBe(1)
    expect(store.cargo).toBe(1)
  })

  it('troca de turno e de eleição', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    store.definirTurno(2, eleicoes)
    expect(store.electionId).toBe('e2')
    expect(store.turno).toBe(2)
  })

  it('converte o corte e limpa filtros', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    store.definirCorte('2022-10-02T18:30')
    expect(store.asOf).toBe('2022-10-02T21:30:00.000Z')
    store.definirUf('SP')
    store.definirNivel('municipio')
    store.definirMunicipio(50308)
    expect(store.uf).toBe('SP')
    expect(store.municipio).toBe(50308)
    store.limpar()
    expect(store.uf).toBeNull()
    expect(store.municipio).toBeNull()
    expect(store.asOfInput).toBe('')
  })

  it('não permite município sem UF', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    store.definirNivel('municipio')
    expect(store.mapLevel).toBe('uf')
  })
})
