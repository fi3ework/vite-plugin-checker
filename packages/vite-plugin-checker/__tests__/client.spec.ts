import { describe, expect, it, vi } from 'vitest'

import { composeOverlayEntryCode, OVERLAY_PATH } from '../src/client'

describe('composeOverlayEntryCode', () => {
  it('imports the overlay by its un-based id and mounts it with the HMR context', () => {
    const code = composeOverlayEntryCode({
      uiUrl: '/static/dist/__checker/',
      badge: 'auto',
      position: 'bl',
      initialIsOpen: true,
    })

    expect(code).toContain(`import { mount } from "${OVERLAY_PATH}"`)
    expect(code).toContain('mount(import.meta.hot, options)')
  })

  it('resolves the page URL against the dev server that served the overlay', () => {
    const code = composeOverlayEntryCode({
      uiUrl: '/static/dist/__checker/',
      badge: 'auto',
      position: 'bl',
      initialIsOpen: true,
    })
    const mount = vi.fn()
    new Function(
      'mount',
      'meta',
      code.replace(/^import .*$/m, '').replaceAll('import.meta', 'meta'),
    )(mount, { url: 'http://localhost:5173/@id/virtual:entry', hot: 'hot' })

    expect(mount).toHaveBeenCalledWith('hot', {
      uiUrl: 'http://localhost:5173/static/dist/__checker/',
      badge: 'auto',
      position: 'bl',
      initialIsOpen: true,
    })
  })
})
