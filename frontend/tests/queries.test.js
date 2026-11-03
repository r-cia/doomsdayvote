import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { api } from '../src/api/client'
import * as q from '../src/composables/queries'
import { useFiltersStore } from '../src/stores/filters'

vi.mock('../src/api/client', () => ({
  api: new Proxy({}, { get: (alvo, nome) => (alvo[nome] ??= vi.fn().mockResolvedValue({})) }),
}))

const ELEICAO = 'b6e1f3a0-0000-4000-8000-000000000001'

function usar(hook) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useFiltersStore()
  Object.assign(store, { electionId: ELEICAO, ano: 2022, turno: 1, cargo: 1 })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  mount(
    defineComponent({
      setup() {
        hook()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient: cliente }]] } },
  )
  return flushPromises().then(() => store)
}

const ultimaChamada = (nome) => api[nome].mock.calls.at(-1)

beforeEach(() => {
  for (const nome of Object.keys(api)) api[nome].mockClear()
})

describe('hooks do recorte', () => {
  it('resumo envia o recorte e a ordenação', async () => {
    await usar(() => q.useResumo({ ordem: 'qt_votos', direcao: 'desc' }))
    expect(ultimaChamada('resumo')[0]).toMatchObject({
      election_id: ELEICAO,
      cargo: 1,
      ordem: 'qt_votos',
      direcao: 'desc',
    })
  })

  it('anomalias usa sufixo por tabela e ignora ordenação em texto', async () => {
    await usar(() =>
      q.useAnomalias(null, { '': { ordem: 'score_if', direcao: 'asc' }, _duplicacao: { ordem: 'total' } }),
    )
    const params = ultimaChamada('anomalias')[0]
    expect(params).toMatchObject({ ordem: 'score_if', direcao_duplicacao: 'asc', ordem_duplicacao: 'total' })
    expect(params).not.toHaveProperty('ordenar_por')

    api.anomalias.mockClear()
    await usar(() => q.useAnomalias(null, ref('if')))
    expect(Object.keys(ultimaChamada('anomalias')[0])).not.toContain('ordem')
  })

  it('linha do tempo envia o corte, granularidade e por_candidato', async () => {
    const store = await usar(() => q.useTimeline())
    expect(ultimaChamada('timeline')[0]).toMatchObject({ granularity: '5m', por_candidato: true })
    expect(ultimaChamada('timeline')[0]).toHaveProperty('as_of')
    expect(store.timelineGranularity).toBe('5m')
  })

  it('mapa envia level, candidatos e as_of_anterior', async () => {
    await usar(() =>
      q.useMapa('uf', { incluirTodosCandidatos: true, candidatos: '13,22', asOfAnterior: '2022-10-02T20:00:00Z' }),
    )
    expect(ultimaChamada('mapa')[0]).toMatchObject({
      level: 'uf',
      candidatos: '13,22',
      as_of_anterior: '2022-10-02T20:00:00Z',
    })
  })

  it('estatísticas envia o escopo', async () => {
    await usar(() => q.useEstatisticas(ref('ano')))
    expect(ultimaChamada('estatisticas')[0].escopo).toBe('ano')
  })

  it('seção e versões usam o id no caminho e só o recorte da seção na query', async () => {
    await usar(() => q.useSecaoVersoes('s1', { comparar_com: 2 }, { _campos: { ordem: 'campo' } }))
    const [id, params] = ultimaChamada('secaoVersoes')
    expect(id).toBe('s1')
    expect(params).toEqual({
      election_id: ELEICAO,
      cargo: 1,
      as_of: null,
      comparar_com: 2,
      ordem_campos: 'campo',
      direcao_campos: 'asc',
    })
  })
})

describe('hooks novos', () => {
  const casos = [
    ['useConsistencia', 'consistencia', () => q.useConsistencia({ regra: 'comparecimento_vs_aptos', page: 2 }), { regra: 'comparecimento_vs_aptos', page: 2 }],
    ['useConcentracao', 'concentracao', () => q.useConcentracao({ limit: 10 }, { _share: { ordem: 'share' }, _margem: { ordem: 'margem', direcao: 'desc' } }), { limit: 10, ordem_share: 'share', direcao_margem: 'desc' }],
    ['useComparacaoLocal', 'comparacaoLocal', () => q.useComparacaoLocal({ page: 3, page_size: 10 }), { page: 3, page_size: 10 }],
    ['useComparacaoLocalSecoes', 'comparacaoLocalSecoes', () => q.useComparacaoLocalSecoes('local:AC|1'), { chave: 'local:AC|1' }],
    ['useRelatorio', 'relatorio', () => q.useRelatorio({ ordem: 'bus', direcao: 'desc' }), { ordem: 'bus', direcao: 'desc' }],
    ['useTotalizacaoMetricas', 'totalizacaoMetricas', () => q.useTotalizacaoMetricas({ lote: 'l1' }), { ano: 2022, turno: 1, lote: 'l1' }],
    ['useTotalizacaoIncidentes', 'totalizacaoIncidentes', () => q.useTotalizacaoIncidentes({ pagina: 2, tamanho: 10 }), { ano: 2022, turno: 1, pagina: 2, tamanho: 10 }],
    ['useTotalizacaoDivergencias', 'totalizacaoDivergencias', () => q.useTotalizacaoDivergencias({ fonte: 'rdv' }), { ano: 2022, turno: 1, fonte: 'rdv' }],
  ]

  it.each(casos)('%s chama %s com os parâmetros esperados', async (_hook, rota, hook, esperado) => {
    await usar(hook)
    expect(ultimaChamada(rota)[0]).toMatchObject(esperado)
  })

  it('comparação entre anos só consulta com dois anos ou mais', async () => {
    await usar(() => q.useComparacaoAnos([2022]))
    expect(api.comparacaoAnos).not.toHaveBeenCalled()
    await usar(() => q.useComparacaoAnos([2018, 2022]))
    expect(ultimaChamada('comparacaoAnos')[0]).toMatchObject({ anos: '2018,2022' })
  })

  it('queryKey muda com os parâmetros', async () => {
    const pagina = ref(1)
    await usar(() => q.useConsistencia({ page: pagina }))
    pagina.value = 2
    await flushPromises()
    expect(api.consistencia.mock.calls.map(([p]) => p.page)).toEqual([1, 2])
  })
})
