import { createI18n } from 'vue-i18n'
import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'

const STORAGE_KEY = 'dv_locale'
const SUPORTADOS = ['pt-BR', 'en-US', 'es-ES']

function detectar() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  if (salvo && SUPORTADOS.includes(salvo)) return salvo
  const nav = (navigator.language || 'pt-BR').toLowerCase()
  if (nav.startsWith('es')) return 'es-ES'
  if (nav.startsWith('en')) return 'en-US'
  return 'pt-BR'
}

const i18n = createI18n({
  legacy: false,
  locale: detectar(),
  fallbackLocale: 'pt-BR',
  messages: {
    'pt-BR': ptBR,
    'en-US': enUS,
    'es-ES': esES,
  },
})

export function definirLocale(locale) {
  if (!SUPORTADOS.includes(locale)) return
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

export { SUPORTADOS }
export default i18n