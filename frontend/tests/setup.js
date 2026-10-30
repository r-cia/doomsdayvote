import { afterEach, vi } from 'vitest'
import { enableAutoUnmount, config } from '@vue/test-utils'
import i18n from '../src/i18n'

i18n.global.locale.value = 'pt-BR'
config.global.plugins = [i18n]

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
