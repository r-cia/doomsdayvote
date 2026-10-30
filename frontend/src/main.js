import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
