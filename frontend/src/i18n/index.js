import { createI18n } from 'vue-i18n'
import ptBR from './locales/pt-BR.json'
import esES from './locales/es-ES.json'
import enUS from './locales/en-US.json'

export const IDIOMAS = ['pt-BR', 'es-ES', 'en-US']
const CHAVE = 'idioma'

function idiomaInicial() {
  const guardado = globalThis.localStorage?.getItem(CHAVE)
  if (IDIOMAS.includes(guardado)) return guardado
  const navegador = (globalThis.navigator?.language ?? '').toLowerCase()
  if (navegador.startsWith('es')) return 'es-ES'
  if (navegador.startsWith('en')) return 'en-US'
  return 'pt-BR'
}

export const i18n = createI18n({
  legacy: false,
  locale: idiomaInicial(),
  fallbackLocale: 'pt-BR',
  messages: { 'pt-BR': ptBR, 'es-ES': esES, 'en-US': enUS },
})

export const t = (chave, ...args) => i18n.global.t(chave, ...args)

export function aplicarIdioma() {
  const idioma = i18n.global.locale.value
  document.documentElement.lang = idioma
  document.title = t('app.titulo')
}

export function definirIdioma(idioma) {
  if (!IDIOMAS.includes(idioma)) return
  i18n.global.locale.value = idioma
  globalThis.localStorage?.setItem(CHAVE, idioma)
  aplicarIdioma()
}
