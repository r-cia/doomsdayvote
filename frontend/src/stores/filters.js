import { defineStore } from 'pinia'
import { deInputSaoPaulo } from '../lib/format'

const CARGOS_PERMITIDOS = new Set(['Presidente', 'Governador'])

function cargosPermitidos(eleicao) {
  return (eleicao?.cargos ?? []).filter((cargo) =>
    CARGOS_PERMITIDOS.has(cargo.ds_cargo_pergunta),
  )
}

function cargoPadrao(eleicao) {
  const cargos = cargosPermitidos(eleicao)
  return (
    cargos.find((cargo) => cargo.ds_cargo_pergunta === 'Presidente') ??
    cargos[0] ??
    null
  )
}

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    electionId: null,
    cargo: null,
    turno: null,
    candidato: null,
    asOfInput: '',
    uf: null,
    municipio: null,
    mapLevel: 'uf',
    mapMode: 'lider',
    timelineGranularity: '5m',
    sectionPage: 1,
    sectionPageSize: 25,
    sectionStatus: '',
    sectionBusca: '',
  }),

  getters: {
    asOf: (state) => deInputSaoPaulo(state.asOfInput),
  },

  actions: {
    inicializar(eleicoes = []) {
      const disponiveis = eleicoes.filter(
        (eleicao) => cargosPermitidos(eleicao).length > 0,
      )
      if (disponiveis.length === 0) return

      const atual = disponiveis.find((eleicao) => eleicao.id === this.electionId)
      if (!atual) {
        this.definirEleicao(disponiveis[0])
        return
      }

      if (this.turno === null) this.turno = atual.nr_turno
      const cargos = cargosPermitidos(atual)
      if (!cargos.some((cargo) => cargo.cd_cargo_pergunta === this.cargo)) {
        this.cargo = cargoPadrao(atual)?.cd_cargo_pergunta ?? null
      }
    },

    definirEleicao(eleicao) {
      if (!eleicao) return
      const cargos = cargosPermitidos(eleicao)
      this.electionId = eleicao.id
      this.turno = eleicao.nr_turno
      this.cargo = cargoPadrao(eleicao)?.cd_cargo_pergunta ?? null
      this.candidato = null
      this.municipio = null
      this.sectionPage = 1
    },

    definirTurno(turno, eleicoes = []) {
      const numero = Number(turno)
      if (!Number.isFinite(numero)) return
      this.turno = numero
      const eleicao = eleicoes.find(
        (item) =>
          item.nr_turno === numero &&
          item.id === this.electionId &&
          cargosPermitidos(item).length > 0,
      )
      if (eleicao) return
      const alternativa = eleicoes.find(
        (item) => item.nr_turno === numero && cargosPermitidos(item).length > 0,
      )
      if (alternativa) this.definirEleicao(alternativa)
    },

    definirCargo(cargo) {
      this.cargo = cargo === null || cargo === undefined ? null : Number(cargo)
      this.candidato = null
      this.sectionPage = 1
    },

    definirCandidato(candidato) {
      this.candidato =
        candidato === null || candidato === undefined || candidato === ''
          ? null
          : Number(candidato)
    },

    definirCorte(valor) {
      this.asOfInput = valor || ''
      this.sectionPage = 1
    },

    definirUf(uf) {
      this.uf = uf || null
      this.municipio = null
      this.sectionPage = 1
      if (!this.uf && this.mapLevel === 'municipio') this.mapLevel = 'uf'
    },

    definirMunicipio(municipio) {
      this.municipio =
        municipio === null || municipio === undefined || municipio === ''
          ? null
          : Number(municipio)
      this.sectionPage = 1
    },

    definirNivel(nivel) {
      if (nivel === 'municipio' && !this.uf) return
      this.mapLevel = nivel === 'municipio' ? 'municipio' : 'uf'
      this.municipio = null
    },

    definirModo(modo) {
      this.mapMode = modo === 'percentual' ? 'percentual' : 'lider'
    },

    definirGranularidade(granularidade) {
      this.timelineGranularity = granularidade === '1m' ? '1m' : '5m'
    },

    definirPagina(pagina) {
      const numero = Number(pagina)
      this.sectionPage = Number.isFinite(numero) && numero > 0 ? numero : 1
    },

    definirTamanhoPagina(tamanho) {
      const numero = Number(tamanho)
      this.sectionPageSize = Number.isFinite(numero) && numero > 0 ? numero : 25
      this.sectionPage = 1
    },

    definirStatusSecao(status) {
      this.sectionStatus = status || ''
      this.sectionPage = 1
    },

    definirBuscaSecao(busca) {
      this.sectionBusca = busca || ''
      this.sectionPage = 1
    },

    limpar() {
      this.candidato = null
      this.asOfInput = ''
      this.uf = null
      this.municipio = null
      this.sectionStatus = ''
      this.sectionBusca = ''
      this.sectionPage = 1
      this.mapLevel = 'uf'
    },
  },
})
