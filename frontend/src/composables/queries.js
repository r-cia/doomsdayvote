import { computed, isRef, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { api } from '../api/client'
import { useFiltersStore } from '../stores/filters'

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

export function useResumo() {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'resumo',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
    ]),
    queryFn: ({ signal }) =>
      api.resumo(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo)),
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
      store.asOf,
      store.uf,
      store.municipio,
      store.timelineGranularity,
    ]),
    queryFn: ({ signal }) =>
      api.timeline(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          granularity: store.timelineGranularity,
          por_candidato: true,
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo)),
    placeholderData: keepPreviousData,
  })
}

export function useAnalise() {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'analise',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
    ]),
    queryFn: ({ signal }) =>
      api.analise(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo)),
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
  return useQuery({
    queryKey: computed(() => [
      'mapa',
      store.electionId,
      store.cargo,
      store.asOf,
      ufDoMapa.value,
      municipioDoMapa.value,
      nivelEfetivo.value,
      store.candidato,
    ]),
    queryFn: ({ signal }) =>
      api.mapa(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: ufDoMapa.value,
          municipio: municipioDoMapa.value,
          level: nivelEfetivo.value,
          candidatos: store.candidato,
        },
        signal,
      ),
    enabled: computed(
      () =>
        Boolean(store.electionId && store.cargo) &&
        (nivelEfetivo.value !== 'municipio' || Boolean(ufDoMapa.value)),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useSecoes() {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'secoes',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      store.sectionStatus,
      store.sectionBusca,
      store.sectionPage,
      store.sectionPageSize,
    ]),
    queryFn: ({ signal }) =>
      api.secoes(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          status: store.sectionStatus,
          busca: store.sectionBusca,
          page: store.sectionPage,
          page_size: store.sectionPageSize,
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo)),
    placeholderData: keepPreviousData,
  })
}

export function useSecao(id) {
  const store = useFiltersStore()
  const idEfetivo = computed(() => {
    const valor = isRef(id) ? id.value : id
    return valor ? String(valor) : null
  })
  return useQuery({
    queryKey: computed(() => [
      'secao',
      idEfetivo.value,
      store.electionId,
      store.cargo,
      store.asOf,
    ]),
    queryFn: ({ signal }) =>
      api.secao(
        idEfetivo.value,
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
        },
        signal,
      ),
    enabled: computed(() =>
      Boolean(idEfetivo.value && store.electionId && store.cargo),
    ),
  })
}
