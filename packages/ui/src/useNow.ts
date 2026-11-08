import { onScopeDispose, ref } from 'vue'

export function useNow(interval = 15_000) {
  const now = ref(Date.now())
  const timer = setInterval(() => {
    now.value = Date.now()
  }, interval)
  onScopeDispose(() => clearInterval(timer))
  return now
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatAgo(timestamp: number, now: number) {
  const seconds = Math.round((timestamp - now) / 1000)
  if (Math.abs(seconds) < 60) return relative.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  return relative.format(Math.round(minutes / 60), 'hour')
}
