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

describe('filters store: ações de recorte', () => {
  it('preserva a eleição atual e recompõe ano, turno e cargo permitido', () => {
    const store = useFiltersStore()
    store.electionId = 'e1'
    store.cargo = 99
    store.inicializar(eleicoes)

    expect(store.ano).toBe(2022)
    expect(store.turno).toBe(1)
    expect(store.cargo).toBe(1)
  })

  it('ignora lista sem cargos permitidos e escolhe a eleição com Presidente', () => {
    const store = useFiltersStore()
    store.inicializar([
      { id: 'x', ano_eleicao: 2020, nr_turno: 1, cargos: [{ ds_cargo_pergunta: 'Senador' }] },
    ])
    expect(store.electionId).toBeNull()

    store.inicializar([
      { id: 'governador', ano_eleicao: 2022, nr_turno: 1, cargos: [{ cd_cargo_pergunta: 3, ds_cargo_pergunta: 'Governador' }] },
      { id: 'presidente', ano_eleicao: 2018, nr_turno: 1, cargos: [{ cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' }] },
    ])
    expect(store.electionId).toBe('presidente')
    expect(store.cargo).toBe(1)
  })

  it('troca de turno para outra eleição e ignora turno inválido', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    store.electionId = 'e2'
    store.definirTurno('abc', eleicoes)
    expect(store.turno).toBe(1)

    store.definirTurno(1, eleicoes)
    expect(store.electionId).toBe('e1')
    expect(store.turno).toBe(1)
  })

  it('normaliza cargo, candidato, corte, UF e município', () => {
    const store = useFiltersStore()
    store.definirCargo('3')
    expect(store.cargo).toBe(3)
    store.definirCandidato('13')
    expect(store.candidato).toBe(13)
    store.definirCandidato('')
    expect(store.candidato).toBeNull()

    store.definirCorte('2022-10-02T19:00')
    expect(store.asOfInput).toBe('2022-10-02T19:00')
    store.definirCorte('')
    expect(store.asOfInput).toBe('')

    store.definirUf('SP')
    store.definirMunicipio('3550308')
    expect(store.municipio).toBe(3550308)
    store.definirUf(null)
    expect(store.uf).toBeNull()
    expect(store.municipio).toBeNull()
    expect(store.mapLevel).toBe('uf')
  })

  it('controla o nível do mapa apenas com UF selecionada', () => {
    const store = useFiltersStore()
    store.definirNivel('municipio')
    expect(store.mapLevel).toBe('uf')

    store.definirUf('SP')
    store.definirNivel('municipio')
    expect(store.mapLevel).toBe('municipio')
    store.definirNivel('outro')
    expect(store.mapLevel).toBe('uf')
  })

  it('normaliza modo, granularidade e paginação', () => {
    const store = useFiltersStore()
    store.definirModo('percentual')
    expect(store.mapMode).toBe('percentual')
    store.definirModo('x')
    expect(store.mapMode).toBe('lider')

    store.definirGranularidade('1m')
    expect(store.timelineGranularity).toBe('1m')
    store.definirGranularidade('x')
    expect(store.timelineGranularity).toBe('5m')

    store.definirPagina('3')
    expect(store.sectionPage).toBe(3)
    store.definirPagina('x')
    expect(store.sectionPage).toBe(1)
    store.definirPagina(-2)
    expect(store.sectionPage).toBe(1)

    store.definirTamanhoPagina(50)
    expect(store.sectionPageSize).toBe(50)
    expect(store.sectionPage).toBe(1)
    store.definirTamanhoPagina(0)
    expect(store.sectionPageSize).toBe(25)
  })

  it('normaliza os filtros de seção', () => {
    const store = useFiltersStore()
    store.definirStatusSecao('aberta')
    expect(store.sectionStatus).toBe('aberta')
    store.definirStatusSecao('')
    expect(store.sectionStatus).toBe('')

    store.definirZonaSecao('7')
    expect(store.sectionZona).toBe(7)
    store.definirZonaSecao('x')
    expect(store.sectionZona).toBeNull()

    store.definirNumeroSecao('241')
    expect(store.sectionSecao).toBe(241)
    store.definirNumeroSecao(0)
    expect(store.sectionSecao).toBeNull()

    store.definirMunicipioSecao('São Paulo')
    expect(store.sectionMunicipioNome).toBe('São Paulo')
    store.definirMunicipioSecao('')
    expect(store.sectionMunicipioNome).toBe('')
  })

  it('limpa o recorte mantendo cargo e turno', () => {
    const store = useFiltersStore()
    store.inicializar(eleicoes)
    store.definirCandidato(13)
    store.definirUf('SP')
    store.definirNivel('municipio')
    store.definirStatusSecao('aberta')
    store.definirZonaSecao(7)
    store.definirNumeroSecao(241)
    store.definirMunicipioSecao('São Paulo')
    store.definirPagina(4)

    store.limpar()

    expect(store.candidato).toBeNull()
    expect(store.asOfInput).toBe('')
    expect(store.uf).toBeNull()
    expect(store.municipio).toBeNull()
    expect(store.sectionStatus).toBe('')
    expect(store.sectionZona).toBeNull()
    expect(store.sectionSecao).toBeNull()
    expect(store.sectionMunicipioNome).toBe('')
    expect(store.sectionPage).toBe(1)
    expect(store.mapLevel).toBe('uf')
    expect(store.cargo).toBe(1)
  })
})
