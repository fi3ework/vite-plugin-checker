import { defineCustomElement } from 'vue'
import App from './App.ce.vue'

const ShadowElement = defineCustomElement(App)
const overlayId = 'vite-plugin-checker-error-overlay'

const runtimeUrl = new URL(import.meta.url)
const runtimeId = runtimeUrl.origin + runtimeUrl.pathname

function defineOverlayElement() {
  for (let i = 0; ; i++) {
    const tagName = i ? `${overlayId}-${i}` : overlayId
    const existing = customElements.get(tagName)
    if (!existing) {
      customElements.define(tagName, ShadowElement)
      return
    }
    if (existing === ShadowElement) return
  }
}

export function inject({
  base,
  overlayConfig,
}: {
  base: string
  overlayConfig: Record<string, any>
}) {
  if (!document.body) {
    document.addEventListener(
      'DOMContentLoaded',
      () => inject({ base, overlayConfig }),
      { once: true },
    )
    return
  }

  const existing = document.querySelectorAll<HTMLElement>(
    '[data-vite-plugin-checker]',
  )
  if ([...existing].some((el) => el.dataset.vitePluginChecker === runtimeId))
    return

  defineOverlayElement()

  const overlayEle = new ShadowElement({
    base,
    overlayConfig,
  })
  overlayEle.dataset.vitePluginChecker = runtimeId
  document.body.appendChild(overlayEle)
}
