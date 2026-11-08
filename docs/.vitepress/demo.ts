import { withBase } from 'vitepress'
import { onBeforeUnmount, ref } from 'vue'

export const demoPage = withBase('/demo/index.html')

/**
 * Control the overlay demo built into `/demo/`. The demo is removed when the
 * calling component unmounts.
 */
export function useOverlayDemo(
  options: { initialIsOpen?: boolean | 'error' } = {},
) {
  const running = ref(false)
  const loading = ref(false)
  let stop: (() => void) | undefined
  let unmounted = false

  async function start() {
    if (stop || loading.value) return
    loading.value = true
    try {
      const overlay = new URL(withBase('/demo/overlay.js'), location.href).href
      const demo = await import(/* @vite-ignore */ overlay)
      if (unmounted) return
      const stopDemo: () => void = demo.start(
        new URL(demoPage, location.href).href,
        options,
      )
      running.value = true
      stop = () => {
        stopDemo()
        running.value = false
        stop = undefined
      }
    } finally {
      loading.value = false
    }
  }

  onBeforeUnmount(() => {
    unmounted = true
    stop?.()
  })

  return { running, loading, start, stop: () => stop?.() }
}
