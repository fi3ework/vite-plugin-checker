import type { OverlayOptions } from '../../../vite-plugin-checker/src/client/options'
import { mount } from '../overlay/main'
import { createDemoServer } from './server'

/**
 * Mount the badge and drawer on the current page, backed by the demo server.
 * Returns a function that removes them again.
 */
export function start(
  uiUrl: string,
  options: Partial<Omit<OverlayOptions, 'uiUrl'>> = {},
) {
  const server = createDemoServer()
  const stopFrames = server.serveFrames()
  mount(server.hot(), {
    badge: true,
    position: 'bl',
    initialIsOpen: true,
    ...options,
    uiUrl,
  })
  return () => {
    for (const host of document.querySelectorAll<HTMLElement>(
      'vite-plugin-checker-overlay',
    )) {
      if (host.dataset.uiUrl === uiUrl) host.remove()
    }
    stopFrames()
    server.close()
  }
}
