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
      redirect: '/painel',
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
  scrollBehavior: (to) => (to.hash ? { el: to.hash, top: 60 } : { top: 0 }),
})

export default router
