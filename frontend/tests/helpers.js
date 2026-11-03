import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useFiltersStore } from '../src/stores/filters'

export const ELEICAO = 'b6e1f3a0-0000-4000-8000-000000000001'

export async function montar(componente, { props = {}, filtros = {} } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  Object.assign(useFiltersStore(), { electionId: ELEICAO, ano: 2022, turno: 1, cargo: 1, ...filtros })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }],
  })
  const wrapper = mount(componente, {
    props,
    global: {
      config: { errorHandler: () => {} },
      plugins: [pinia, router, [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
    },
  })
  await flushPromises()
  return wrapper
}
