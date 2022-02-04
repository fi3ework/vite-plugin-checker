/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import App from './App.svelte'

let enableOverlay = true

let overlayEle = null
let app = null
let checkerResultsStore = []

class ErrorOverlay extends HTMLElement {
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.addEventListener('click', () => {
      clearErrorOverlay()
    })
  }

  close() {
    this.parentNode?.removeChild(this)
  }
}

const overlayId = 'vite-plugin-checker-error-overlay'
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay)
}

function updateErrorOverlay(payloads) {
  if (!enableOverlay) return

  const payloadArray = Array.isArray(payloads) ? payloads : [payloads]
  checkerResultsStore = checkerResultsStore.filter((existCheckerResult) => {
    return !payloadArray.map((p) => p.checkerId).includes(existCheckerResult.checkerId)
  })

  checkerResultsStore = [...checkerResultsStore, ...payloadArray]
  const hasDiagnosticToShowInOverlay = checkerResultsStore.some((p) => p.diagnostics.length)

  // remove overlay when no error exists
  if (!hasDiagnosticToShowInOverlay) {
    clearErrorOverlay()
    overlayEle = null
    app = null
    return
  }

  if (!overlayEle) {
    // if after full-reload
    overlayEle = new ErrorOverlay()
    document.body.appendChild(overlayEle)
    app = new App({
      target: overlayEle.root,
      props: {
        checkerResults: checkerResultsStore,
      },
    })
  } else {
    // HMR update
    app.$$set({
      checkerResults: checkerResultsStore,
    })
  }
}

function resumeErrorOverlay(data) {
  const payloadsToResume = data.map((d) => d.data)
  updateErrorOverlay(payloadsToResume)
}

function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => n.close())
  overlayEle = null
  app = null
}

const fixtures = {
  checkerId: 'typescript',
  diagnostics: [
    {
      message:
        "Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.",
      stack: '',
      id: '/Users/vite-plugin-checker/playground/react-ts/src/App.tsx',
      frame:
        '    4 |\n    5 | function App() {\n  > 6 |   const [count, setCount] = useState<string>(1)\n      |                                              ^\n    7 |   return (\n    8 |     <div className="App">\n    9 |       <header className="App-header">',
      checkerId: 'TypeScript',
      level: 1,
      loc: {
        file: '/Users/vite-plugin-checker/playground/react-ts/src/App.tsx',
        line: 6,
        column: 46,
      },
    },
  ],
}

export function inject() {
  setTimeout(() => {
    updateErrorOverlay([fixtures, fixtures, fixtures])
  }, 1000)
}

inject()
