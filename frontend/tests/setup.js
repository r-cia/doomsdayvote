import { afterEach, vi } from 'vitest'
import { config, enableAutoUnmount } from '@vue/test-utils'
import { definirIdioma, i18n } from '../src/i18n'

config.global.plugins = [i18n]
definirIdioma('pt-BR')

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
