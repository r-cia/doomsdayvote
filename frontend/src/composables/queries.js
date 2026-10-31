import { computed, toValue, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { api } from '../api/client'
import { useFiltersStore } from '../stores/filters'

const CARGO_GOVERNADOR = 3

const paramsDe = (ordem) => toValue(ordem) ?? {}

const habilitadoBase = (store) =>
  Boolean(store.electionId && store.cargo && !(Number(store.cargo) === CARGO_GOVERNADOR && !store.uf))

const filtrosBase = (store) => ({
  election_id: store.electionId,
  cargo: store.cargo,
  as_of: store.asOf,
  uf: store.uf,
  municipio: store.municipio,
})

const chaveBase = (store) => [store.electionId, store.cargo, store.asOf, store.uf, store.municipio]

export function useEleicoes() {
  const store = useFiltersStore()
  const query = useQuery({
    queryKey: ['eleicoes'],
    queryFn: ({ signal }) => api.eleicoes(signal),
    staleTime: Infinity,
  })

  watch(
    () => query.data.value?.eleicoes,
    (eleicoes) => {
      if (eleicoes) store.inicializar(eleicoes)
    },
    { immediate: true },
  )

  return query
}

export function useResumo(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['resumo', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.resumo({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useTimeline() {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'timeline',
      store.electionId,
      store.cargo,
      store.uf,
      store.municipio,
      store.timelineGranularity,
    ]),
    queryFn: ({ signal }) =>
      api.timeline(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          uf: store.uf,
          municipio: store.municipio,
          granularity: store.timelineGranularity,
          por_candidato: true,
        },
        signal,
      ),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useAnalise(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['analise', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.analise({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useAnomalias(habilitado = null, ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['anomalias', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.anomalias({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store) && toValue(habilitado ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useEstatisticas(escopo, ordem = null) {
  const store = useFiltersStore()
  const escopoValor = computed(() => toValue(escopo) ?? 'turno')
  return useQuery({
    queryKey: computed(() => ['estatisticas', ...chaveBase(store), escopoValor.value, paramsDe(ordem)]),
    queryFn: ({ signal }) =>
      api.estatisticas({ ...filtrosBase(store), escopo: escopoValor.value, ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useMapa(nivel = null, opcoes = {}) {
  const store = useFiltersStore()
  const nivelEfetivo = computed(() => nivel ?? store.mapLevel)
  const ufDoMapa = computed(() => (opcoes.ignorarUf ? null : store.uf))
  const municipioDoMapa = computed(() =>
    opcoes.ignorarMunicipio ? null : store.municipio,
  )
  const asOfEfetivo = computed(() => {
    const v = toValue(opcoes.asOfOverride)
    return (v === null || v === undefined || v === '') ? store.asOf : v
  })
  const asOfAnterior = computed(() => {
    const v = toValue(opcoes.asOfAnterior)
    return (v === null || v === undefined || v === '') ? undefined : v
  })
  const candidatosMapa = computed(() =>
    opcoes.incluirTodosCandidatos ? toValue(opcoes.candidatos) : store.candidato,
  )

  return useQuery({
    queryKey: computed(() => [
      'mapa',
      store.electionId,
      store.cargo,
      asOfEfetivo.value,
      asOfAnterior.value,
      ufDoMapa.value,
      municipioDoMapa.value,
      nivelEfetivo.value,
      opcoes.incluirTodosCandidatos ? candidatosMapa.value : store.candidato,
      paramsDe(opcoes.ordem),
    ]),
    queryFn: ({ signal }) =>
      api.mapa(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: asOfEfetivo.value,
          as_of_anterior: asOfAnterior.value,
          uf: ufDoMapa.value,
          municipio: municipioDoMapa.value,
          level: nivelEfetivo.value,
          candidatos: candidatosMapa.value,
          ...paramsDe(opcoes.ordem),
        },
        signal,
      ),
    enabled: computed(
      () => habilitadoBase(store) && (nivelEfetivo.value !== 'municipio' || Boolean(ufDoMapa.value)),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useSecoes(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'secoes',
      ...chaveBase(store),
      store.sectionStatus,
      store.sectionZona,
      store.sectionSecao,
      store.sectionMunicipioNome,
      store.sectionPage,
      store.sectionPageSize,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.secoes(
        {
          ...filtrosBase(store),
          status: store.sectionStatus,
          zona: store.sectionZona,
          secao: store.sectionSecao,
          municipio_nome: store.sectionMunicipioNome,
          page: store.sectionPage,
          page_size: store.sectionPageSize,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => habilitadoBase(store) && Boolean(store.municipio)),
    placeholderData: keepPreviousData,
  })
}

export function useConsistencia(regra = null, ordem = null) {
  const store = useFiltersStore()
  const regraEfetiva = computed(() => toValue(regra))
  return useQuery({
    queryKey: computed(() => ['consistencia', ...chaveBase(store), regraEfetiva.value ?? null, paramsDe(ordem)]),
    queryFn: ({ signal }) =>
      api.consistencia(
        { ...filtrosBase(store), regra: regraEfetiva.value ?? undefined, ...paramsDe(ordem) },
        signal,
      ),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useComparacaoLocal(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['comparacao-local', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.comparacaoLocal({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useConcentracao(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['concentracao', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.concentracao({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useRelatorio(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => ['relatorio', ...chaveBase(store), paramsDe(ordem)]),
    queryFn: ({ signal }) => api.relatorio({ ...filtrosBase(store), ...paramsDe(ordem) }, signal),
    enabled: computed(() => habilitadoBase(store)),
    placeholderData: keepPreviousData,
  })
}

export function useSecao(id, ordem = null) {
  const store = useFiltersStore()
  const idEfetivo = computed(() => {
    const valor = toValue(id)
    return valor ? String(valor) : null
  })
  return useQuery({
    queryKey: computed(() => [
      'secao',
      idEfetivo.value,
      store.electionId,
      store.cargo,
      store.asOf,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.secao(
        idEfetivo.value,
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(idEfetivo.value) && habilitadoBase(store)),
    placeholderData: (anterior, consulta) => (consulta?.queryKey[1] === idEfetivo.value ? anterior : undefined),
  })
}


export function useSecaoVersoes(id, ordem = null) {
  const store = useFiltersStore()
  const idEfetivo = computed(() => {
    const valor = toValue(id)
    return valor ? String(valor) : null
  })
  return useQuery({
    queryKey: computed(() => [
      'secao-versoes',
      idEfetivo.value,
      store.electionId,
      store.cargo,
      store.asOf,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.secaoVersoes(
        idEfetivo.value,
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(idEfetivo.value) && habilitadoBase(store)),
    placeholderData: (anterior, consulta) => (consulta?.queryKey[1] === idEfetivo.value ? anterior : undefined),
  })
}
