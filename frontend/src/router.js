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
      path: '/encerramento',
      name: 'encerramento',
      component: () => import('./views/EncerramentoView.vue'),
    },
    {
      path: '/auditoria',
      redirect: '/painel',
    },
    {
      path: '/secoes/:id',
      name: 'secao',
      component: () => import('./views/SecaoView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/painel' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
