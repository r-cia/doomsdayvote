import { computed } from 'vue'
import { useFiltersStore } from '../stores/filters'
import { useEleicoes } from './queries'

const ORDEM_CARGOS = { Presidente: 0, Governador: 1 }

export function useSelecaoEleicao() {
  const store = useFiltersStore()
  const eleicoesQuery = useEleicoes()

  const eleicoes = computed(() => eleicoesQuery.data.value?.eleicoes ?? [])

  const eleicoesDisponiveis = computed(() =>
    eleicoes.value.filter((eleicao) =>
      (eleicao.cargos ?? []).some(
        (cargo) => cargo.ds_cargo_pergunta in ORDEM_CARGOS,
      ),
    ),
  )

  const eleicaoAtual = computed(() =>
    eleicoesDisponiveis.value.find((eleicao) => eleicao.id === store.electionId),
  )

  const cargos = computed(() => {
    const mapa = new Map()
    for (const eleicao of eleicoesDisponiveis.value) {
      for (const cargo of eleicao.cargos ?? []) {
        if (!(cargo.ds_cargo_pergunta in ORDEM_CARGOS)) continue
        mapa.set(cargo.cd_cargo_pergunta, cargo.ds_cargo_pergunta)
      }
    }
    return [...mapa.entries()]
      .map(([cd, ds]) => ({ cd_cargo_pergunta: cd, ds_cargo_pergunta: ds }))
      .sort(
        (a, b) =>
          (ORDEM_CARGOS[a.ds_cargo_pergunta] ?? 9) -
          (ORDEM_CARGOS[b.ds_cargo_pergunta] ?? 9),
      )
  })

  const eleicoesDoCargo = computed(() =>
    eleicoesDisponiveis.value.filter((eleicao) =>
      (eleicao.cargos ?? []).some(
        (cargo) => cargo.cd_cargo_pergunta === store.cargo,
      ),
    ),
  )

  const anos = computed(() =>
    [...new Set(eleicoesDoCargo.value.map((eleicao) => eleicao.ano_eleicao))].sort(
      (a, b) => b - a,
    ),
  )

  const turnos = computed(() =>
    [
      ...new Set(
        eleicoesDoCargo.value
          .filter(
            (eleicao) => eleicao.ano_eleicao === eleicaoAtual.value?.ano_eleicao,
          )
          .map((eleicao) => eleicao.nr_turno),
      ),
    ].sort((a, b) => a - b),
  )

  const filtros = computed(() => ({
    electionId: store.electionId,
    ano: eleicaoAtual.value?.ano_eleicao ?? null,
    cargo: store.cargo,
    turno: store.turno,
    candidato: store.candidato,
    asOfInput: store.asOfInput,
    uf: store.uf,
    municipio: store.municipio,
  }))

  function eleicaoPara(cargo, ano, turno) {
    const opcoes = eleicoesDisponiveis.value.filter((eleicao) =>
      (eleicao.cargos ?? []).some((item) => item.cd_cargo_pergunta === cargo),
    )
    return (
      opcoes.find(
        (eleicao) => eleicao.ano_eleicao === ano && eleicao.nr_turno === turno,
      ) ??
      opcoes.find((eleicao) => eleicao.ano_eleicao === ano) ??
      opcoes[0] ??
      null
    )
  }

  function aplicarEleicao(eleicao, cargo) {
    if (!eleicao) return
    store.definirEleicao(eleicao)
    store.definirCargo(cargo)
  }

  function aoCargo(cargo) {
    aplicarEleicao(
      eleicaoPara(
        cargo,
        eleicaoAtual.value?.ano_eleicao,
        eleicaoAtual.value?.nr_turno,
      ),
      cargo,
    )
  }

  function aoAno(ano) {
    aplicarEleicao(
      eleicaoPara(store.cargo, ano, eleicaoAtual.value?.nr_turno),
      store.cargo,
    )
  }

  function aoTurno(turno) {
    aplicarEleicao(
      eleicaoPara(store.cargo, eleicaoAtual.value?.ano_eleicao, turno),
      store.cargo,
    )
  }

  function aoCandidato(candidato) {
    const numero =
      candidato === null || candidato === undefined ? null : Number(candidato)
    store.definirCandidato(store.candidato === numero ? null : numero)
  }

  function aoCorte(valor) {
    store.definirCorte(valor)
  }

  function aoUf(uf) {
    store.definirUf(uf)
  }

  function limparMunicipio() {
    store.definirMunicipio(null)
  }

  function limpar() {
    store.limpar()
  }

  return {
    store,
    eleicoesQuery,
    eleicoesDisponiveis,
    eleicaoAtual,
    cargos,
    anos,
    turnos,
    filtros,
    aoCargo,
    aoAno,
    aoTurno,
    aoCandidato,
    aoCorte,
    aoUf,
    limparMunicipio,
    limpar,
  }
}
