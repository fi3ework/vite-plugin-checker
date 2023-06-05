import { ref } from 'vue'
import { prepareListen, listenToCustomMessage, listenToReconnectMessage } from './ws'

const checkerResults = ref<any[]>([])

function updateErrorOverlay(payloads: any) {
  const payloadArray = Array.isArray(payloads) ? payloads : [payloads]
  const nextCheckerResults = [
    ...payloadArray,
    ...checkerResults.value.filter((existCheckerResult) => {
      return !payloadArray.map((p) => p.checkerId).includes(existCheckerResult.checkerId)
    }),
  ]

  checkerResults.value = nextCheckerResults
}

function resumeErrorOverlay(data: any) {
  const payloadsToResume = data.map((d: any) => d.data)
  updateErrorOverlay(payloadsToResume)
}

export function useChecker() {
  const ws = prepareListen()
  listenToCustomMessage(updateErrorOverlay as any)
  listenToReconnectMessage(resumeErrorOverlay as any)
  ws.startListening()

  return {
    checkerResults,
  }
}
