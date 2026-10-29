import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
