import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/painel' },
    {
      path: '/painel',
      name: 'painel',
      component: () => import('./views/PainelView.vue'),
    },
    {
      path: '/mapa',
      name: 'mapa',
      component: () => import('./views/MapaView.vue'),
    },
    {
      path: '/analise',
      name: 'analise',
      component: () => import('./views/AnaliseView.vue'),
    },
    {
      path: '/biometria',
      name: 'biometria',
      component: () => import('./views/BiometriaView.vue'),
    },
    {
      path: '/comparacoes',
      name: 'comparacoes',
      component: () => import('./views/ComparacoesView.vue'),
    },
    {
      path: '/relatorio',
      name: 'relatorio',
      component: () => import('./views/RelatorioView.vue'),
    },
    {
      path: '/encerramento',
      name: 'encerramento',
      component: () => import('./views/EncerramentoView.vue'),
    },
    {
      path: '/auditoria',
      redirect: '/painel',
    },
    { path: '/:pathMatch(.*)*', redirect: '/painel' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
