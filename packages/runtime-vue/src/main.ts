import { defineCustomElement } from 'vue'
import App from './App.ce.vue'

const ShadowElement = defineCustomElement(App)
const overlayId = 'vite-plugin-checker-error-overlay'

if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ShadowElement)
}

export function inject({ base, overlayConfig }) {
  const overlayEle = new ShadowElement({
    base,
    overlayConfig,
  })
  document.body.appendChild(overlayEle)
}
