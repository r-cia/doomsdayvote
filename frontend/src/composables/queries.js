import { computed, isRef, toValue, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { api } from '../api/client'
import { useFiltersStore } from '../stores/filters'

const paramsDe = (ordem) => toValue(ordem) ?? {}

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
    queryKey: computed(() => [
      'resumo',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.resumo(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
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

export function useAnalise(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'analise',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.analise(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
    placeholderData: keepPreviousData,
  })
}

export function useAnomalias(habilitado = null, ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'anomalias',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.anomalias(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
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

export function useEstatisticas(escopo, ordem = null) {
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
      paramsDe(ordem),
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
          ...paramsDe(ordem),
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
      () =>
        Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)) &&
        (nivelEfetivo.value !== 'municipio' || Boolean(ufDoMapa.value)),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useSecoes(ordem = null) {
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
      paramsDe(ordem),
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
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() =>
      Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf) && store.municipio),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useConsistencia(regra = null, ordem = null) {
  const store = useFiltersStore()
  const regraEfetiva = computed(() =>
    typeof regra === 'function' ? regra() : regra?.value !== undefined ? regra.value : regra,
  )
  return useQuery({
    queryKey: computed(() => [
      'consistencia',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      regraEfetiva.value ?? null,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.consistencia(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          regra: regraEfetiva.value ?? undefined,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
    placeholderData: keepPreviousData,
  })
}

export function useComparacaoLocal(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'comparacao-local',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.comparacaoLocal(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
    placeholderData: keepPreviousData,
  })
}

export function useConcentracao(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'concentracao',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.concentracao(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(() => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf))),
    placeholderData: keepPreviousData,
  })
}

export function useRelatorio(ordem = null) {
  const store = useFiltersStore()
  return useQuery({
    queryKey: computed(() => [
      'relatorio',
      store.electionId,
      store.cargo,
      store.asOf,
      store.uf,
      store.municipio,
      paramsDe(ordem),
    ]),
    queryFn: ({ signal }) =>
      api.relatorio(
        {
          election_id: store.electionId,
          cargo: store.cargo,
          as_of: store.asOf,
          uf: store.uf,
          municipio: store.municipio,
          ...paramsDe(ordem),
        },
        signal,
      ),
    enabled: computed(
      () => Boolean(store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)),
    ),
    placeholderData: keepPreviousData,
  })
}

export function useSecao(id, ordem = null) {
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
    enabled: computed(() =>
      Boolean(idEfetivo.value && store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)),
    ),
    placeholderData: (anterior, consulta) => (consulta?.queryKey[1] === idEfetivo.value ? anterior : undefined),
  })
}


export function useSecaoVersoes(id, ordem = null) {
  const store = useFiltersStore()
  const idEfetivo = computed(() => {
    const valor = isRef(id) ? id.value : id
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
    enabled: computed(() =>
      Boolean(idEfetivo.value && store.electionId && store.cargo && !(Number(store.cargo) === 3 && !store.uf)),
    ),
    placeholderData: (anterior, consulta) => (consulta?.queryKey[1] === idEfetivo.value ? anterior : undefined),
  })
}
