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
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
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
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
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
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
    placeholderData: keepPreviousData,
  })
}

export function useAnomalias(habilitado = null, ordenarPor = null) {
  const store = useFiltersStore()
  const ordenacao = computed(() =>
    typeof ordenarPor === 'function'
      ? ordenarPor()
      : ordenarPor?.value !== undefined
        ? ordenarPor.value
        : (ordenarPor ?? 'if'),
  )
  return useQuery({
    queryKey: computed(() => [
      'anomalias',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      ordenacao.value,
    ]),
    queryFn: ({ signal }) =>
      api.anomalias(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ordenar_por: ordenacao.value,
        },
        signal,
      ),
    enabled: computed(
      () =>
        Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)) &&
        (habilitado ? habilitado.value : true),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useEstatisticas(escopo) {
  const store = useFiltersStore()
  const escopoValor = computed(() => escopo?.value ?? escopo ?? 'turno')
  return useQuery({
    queryKey: computed(() => [
      'estatisticas',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      escopoValor.value,
    ]),
    queryFn: ({ signal }) =>
      api.estatisticas(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          escopo: escopoValor.value,
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
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
    const o = opcoes.asOfOverride
    const v = o && typeof o === 'object' && 'value' in o ? o.value : o
    return (v === null || v === undefined || v === '') ? store.asOf : v
  })
  const asOfAnterior = computed(() => {
    const o = opcoes.asOfAnterior
    const v = o && typeof o === 'object' && 'value' in o ? o.value : o
    return (v === null || v === undefined || v === '') ? undefined : v
  })
  const candidatosMapa = computed(() => {
    if (!opcoes.incluirTodosCandidatos) return store.candidato
    if (typeof opcoes.candidatos === 'function') return opcoes.candidatos()
    if (opcoes.candidatos?.value !== undefined) return opcoes.candidatos.value
    return opcoes.candidatos
  })

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
        },
        signal,
      ),
    enabled: computed(
      () =>
        Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)) &&
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
      store.sectionZona,
      store.sectionSecao,
      store.sectionMunicipioNome,
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
          zona: store.sectionZona,
          secao: store.sectionSecao,
          municipio_nome: store.sectionMunicipioNome,
          page: store.sectionPage,
          page_size: store.sectionPageSize,
        },
        signal,
      ),
    enabled: computed(() =>
      Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf) && store.municipio),
    ),
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
      Boolean(idEfetivo.value && store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)),
    ),
  })
}
