import { computed, toValue, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { api } from '../api/client'
import { useFiltersStore } from '../stores/filters'

const baseDoRecorte = (store) => ({
  election_id: store.electionId,
  cargo: store.cargo,
  as_of: store.asOf,
  uf: store.uf,
  municipio: store.municipio,
})

const baseDaSecao = (store) => ({
  election_id: store.electionId,
  cargo: store.cargo,
  as_of: store.asOf,
})

const baseDaTotalizacao = (store) => ({
  ano: store.ano,
  turno: store.turno,
  uf: store.uf,
  municipio: store.municipio,
})

const prontoDoRecorte = (store) => Boolean(store.electionId && store.cargo)
const prontoDaTotalizacao = (store) => Boolean(store.ano && store.turno)

// ordenacoes: { ordem, direcao } para a tabela única, ou { [sufixo]: { ordem, direcao } }
// nas rotas com mais de uma tabela (sufixos do backend: _biometria_uf, _share, ...).
function paramsOrdenacao(ordenacoes) {
  const valor = toValue(ordenacoes)
  if (!valor || typeof valor !== 'object') return {}
  const porSufixo = 'ordem' in valor ? { '': valor } : valor
  const params = {}
  for (const [sufixo, item] of Object.entries(porSufixo)) {
    const ordenacao = toValue(item)
    if (ordenacao?.ordem) {
      params[`ordem${sufixo}`] = ordenacao.ordem
      params[`direcao${sufixo}`] = ordenacao.direcao ?? 'asc'
    }
  }
  return params
}

function valores(opcoes) {
  return Object.fromEntries(
    Object.entries(opcoes ?? {}).map(([chave, valor]) => [chave, toValue(valor)]),
  )
}

function consulta(
  nome,
  chamar,
  {
    base = baseDoRecorte,
    pronto = prontoDoRecorte,
    extra = () => ({}),
    ordenacoes = null,
    habilitado = null,
    identidade = () => [],
  } = {},
) {
  const store = useFiltersStore()
  const params = computed(() => ({
    ...base(store),
    ...extra(),
    ...paramsOrdenacao(ordenacoes),
  }))
  return useQuery({
    queryKey: computed(() => [nome, ...identidade(), params.value]),
    queryFn: ({ signal }) => chamar(params.value, signal),
    enabled: computed(
      () => pronto(store) && (habilitado === null || Boolean(toValue(habilitado))),
    ),
    placeholderData: keepPreviousData,
  })
}

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

export function useResumo(ordenacoes) {
  return consulta('resumo', api.resumo, { ordenacoes })
}

export function useTimeline() {
  const store = useFiltersStore()
  return consulta('timeline', api.timeline, {
    extra: () => ({ granularity: store.timelineGranularity, por_candidato: true }),
  })
}

export function useAnalise(ordenacoes) {
  return consulta('analise', api.analise, { ordenacoes })
}

export function useAnomalias(habilitado = null, ordenacoes = null) {
  return consulta('anomalias', api.anomalias, { habilitado, ordenacoes })
}

export function useEstatisticas(escopo, ordenacoes) {
  return consulta('estatisticas', api.estatisticas, {
    extra: () => ({ escopo: toValue(escopo) ?? 'turno' }),
    ordenacoes,
  })
}

export function useMapa(nivel = null, opcoes = {}) {
  const store = useFiltersStore()
  const vazio = (v) => v === null || v === undefined || v === ''
  const nivelEfetivo = () => nivel ?? store.mapLevel
  const ufDoMapa = () => (opcoes.ignorarUf ? null : store.uf)
  return consulta('mapa', api.mapa, {
    extra: () => {
      const asOf = toValue(opcoes.asOfOverride)
      const anterior = toValue(opcoes.asOfAnterior)
      return {
        as_of: vazio(asOf) ? store.asOf : asOf,
        as_of_anterior: vazio(anterior) ? undefined : anterior,
        uf: ufDoMapa(),
        municipio: opcoes.ignorarMunicipio ? null : store.municipio,
        level: nivelEfetivo(),
        candidatos: opcoes.incluirTodosCandidatos
          ? toValue(opcoes.candidatos)
          : store.candidato,
      }
    },
    ordenacoes: opcoes.ordenacoes,
    habilitado: () => nivelEfetivo() !== 'municipio' || Boolean(ufDoMapa()),
  })
}

export function useSecoes(ordenacoes) {
  const store = useFiltersStore()
  return consulta('secoes', api.secoes, {
    extra: () => ({
      status: store.sectionStatus,
      zona: store.sectionZona,
      secao: store.sectionSecao,
      municipio_nome: store.sectionMunicipioNome,
      page: store.sectionPage,
      page_size: store.sectionPageSize,
    }),
    ordenacoes,
    habilitado: () => Boolean(store.municipio),
  })
}

export function useSecao(id, ordenacoes) {
  const idEfetivo = () => (toValue(id) ? String(toValue(id)) : null)
  return consulta('secao', (params, signal) => api.secao(idEfetivo(), params, signal), {
    base: baseDaSecao,
    ordenacoes,
    habilitado: () => Boolean(idEfetivo()),
    identidade: () => [idEfetivo()],
  })
}

export function useSecaoVersoes(id, opcoes = {}, ordenacoes) {
  const idEfetivo = () => (toValue(id) ? String(toValue(id)) : null)
  return consulta(
    'secao-versoes',
    (params, signal) => api.secaoVersoes(idEfetivo(), params, signal),
    {
      base: baseDaSecao,
      extra: () => valores(opcoes),
      ordenacoes,
      habilitado: () => Boolean(idEfetivo()),
      identidade: () => [idEfetivo()],
    },
  )
}

export function useConsistencia(opcoes = {}, ordenacoes) {
  return consulta('consistencia', api.consistencia, {
    extra: () => valores(opcoes),
    ordenacoes,
  })
}

export function useConcentracao(opcoes = {}, ordenacoes) {
  return consulta('concentracao', api.concentracao, {
    extra: () => valores(opcoes),
    ordenacoes,
  })
}

export function useComparacaoLocal(opcoes = {}, ordenacoes) {
  return consulta('comparacao-local', api.comparacaoLocal, {
    extra: () => valores(opcoes),
    ordenacoes,
  })
}

export function useComparacaoLocalSecoes(chave, ordenacoes) {
  return consulta('comparacao-local-secoes', api.comparacaoLocalSecoes, {
    extra: () => ({ chave: toValue(chave) }),
    ordenacoes,
    habilitado: () => Boolean(toValue(chave)),
  })
}

export function useRelatorio(ordenacoes) {
  return consulta('relatorio', api.relatorio, { ordenacoes })
}

export function useComparacaoAnos(anos) {
  const store = useFiltersStore()
  const lista = () => toValue(anos) ?? []
  return consulta('comparacao-anos', api.comparacaoAnos, {
    base: () => ({ uf: store.uf }),
    pronto: () => lista().length >= 2,
    extra: () => ({ anos: lista().join(',') }),
  })
}

function totalizacao(nome, chamar, opcoes, habilitado) {
  return consulta(nome, chamar, {
    base: baseDaTotalizacao,
    pronto: prontoDaTotalizacao,
    extra: () => valores(opcoes),
    habilitado,
  })
}

export function useTotalizacaoMetricas(opcoes = {}) {
  return totalizacao('totalizacao-metricas', api.totalizacaoMetricas, opcoes)
}

export function useTotalizacaoIncidentes(opcoes = {}, habilitado = null) {
  return totalizacao('totalizacao-incidentes', api.totalizacaoIncidentes, opcoes, habilitado)
}

export function useTotalizacaoDivergencias(opcoes = {}, habilitado = null) {
  return totalizacao('totalizacao-divergencias', api.totalizacaoDivergencias, opcoes, habilitado)
}
