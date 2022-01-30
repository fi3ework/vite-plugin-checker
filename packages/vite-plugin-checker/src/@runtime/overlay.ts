import type { ErrorPayload } from 'vite'

export type OverlayPayload =
  | {
      type: 'full-reload' | 'update'
    }
  | (WsErrorPayload | WsReconnectPayload)

export interface WsErrorPayload {
  type: 'custom'
  event: 'vite-plugin-checker:error'
  data: OverlayData
}

export interface WsReconnectPayload {
  type: 'custom'
  event: 'vite-plugin-checker:reconnect'
  data: WsErrorPayload[]
}

export interface OverlayData {
  checkerId: string
  errors: ErrorPayload['err'][]
}

const template = (errors: string[]) => `
<style>
:host {
  position: fixed;
  z-index: 9999; 
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: #d8d8d8;
  margin: 40px auto;
  padding: 8px 16px;
  position: relative;
  background: #0D1117;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: scroll;
  direction: ltr;
  text-align: left;
  max-height: 80vh;
}

pre {
  font-family: var(--monospace);
  font-size: 14px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message-item {
  border-top: 1px dotted #666;
  padding: 12px 0 0 0;
}

.message-item:first-child {
  border-top: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 12px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
<div class="window">
  <div class="message-list">
    ${errors.join('\n')}
  </div>
  <div class="tip">
    Click outside or fix the code to dismiss. You can also disable this overlay by setting
    <code>config.overlay</code> to <code>false</code> in <code>vite.config.js.</code>
  </div>
</div>
`

const errorItemTemplate = (checkerId: string) => `  <div class="message-item checker-${checkerId}">
    <pre class="message"><span class="plugin"></span><span class="message-body"></span></pre>
    <pre class="file"></pre>
    <pre class="frame"></pre>
    <pre class="stack"></pre>
  </div>
`

const fileRE = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g
const codeframeRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm

export class ErrorOverlay extends HTMLElement {
  public root: ShadowRoot

  public constructor(data: OverlayData | OverlayData[]) {
    super()

    this.root = this.attachShadow({ mode: 'open' })
    this.prepareWindow()
    // this.root.innerHTML = template(new Array(errors.length).fill(errorTemplate))

    if (Array.isArray(data)) {
      if (data.length) {
        data.forEach((item) => this.appendErrors(item))
      } else {
        return
      }
    } else {
      this.appendErrors(data)
    }

    this.root.querySelector('.window')!.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    this.addEventListener('click', () => {
      this.close()
    })
  }

  public clearErrors(checkerId: string) {
    this.root.querySelectorAll(`.message-list .${checkerId}`).forEach((el) => el.remove())
  }

  public prepareWindow() {
    this.root.innerHTML = template([])
  }

  public appendErrors({ errors, checkerId }: OverlayData) {
    if (!errors.length) {
      return
    }

    const toAppend: string[] = new Array(errors.length).fill(errorItemTemplate(checkerId))
    this.root.querySelector('.message-list')!.innerHTML += toAppend.join('')
    errors.forEach((err, index) => {
      codeframeRE.lastIndex = 0
      const hasFrame = err.frame && codeframeRE.test(err.frame)
      const message = hasFrame ? err.message.replace(codeframeRE, '') : err.message
      const ele = this.root.querySelectorAll(`.checker-${checkerId}.message-item`)[
        index
      ] as HTMLElement

      if (err.plugin) {
        this.text({
          ele,
          selector: '.plugin',
          text: `[${err.plugin}] `,
        })
      }
      this.text({
        ele,
        selector: '.message-body',
        text: message.trim(),
      })

      const [file] = (err.loc?.file || err.id || 'unknown file').split(`?`)
      if (err.loc) {
        this.text({
          ele,
          selector: '.file',
          linkFiles: true,
          text: `${file}:${err.loc.line}:${err.loc.column}`,
        })
      } else if (err.id) {
        this.text({
          ele,
          selector: '.file',
          text: file,
        })
      }

      if (hasFrame) {
        this.text({
          ele,
          selector: '.frame',
          text: err.frame!.trim(),
        })
      }

      this.text({
        ele,
        selector: '.stack',
        text: err.stack,
        linkFiles: true,
      })
    })
  }

  public updateErrors({ errors, checkerId }: OverlayData) {
    this.clearErrors(checkerId)
    this.appendErrors({ errors, checkerId })
  }

  public getErrorCount() {
    return this.root.querySelectorAll('.message-item').length
  }

  // eslint-disable-next-line max-params
  public text({
    ele,
    selector,
    text,
    linkFiles = false,
  }: {
    ele: HTMLElement
    selector: string
    text: string
    linkFiles?: boolean
  }): void {
    const el = ele.querySelector(selector)!
    if (!linkFiles) {
      el.textContent = text
    } else {
      let curIndex = 0
      let match: RegExpExecArray | null
      while ((match = fileRE.exec(text))) {
        const { 0: file, index } = match
        if (index !== null) {
          const frag = text.slice(curIndex, index)
          el.appendChild(document.createTextNode(frag))
          const link = document.createElement('a')
          link.textContent = file
          link.className = 'file-link'
          link.onclick = () => {
            fetch('/__open-in-editor?file=' + encodeURIComponent(file))
          }
          el.appendChild(link)
          curIndex += frag.length + file.length
        }
      }
    }
  }

  public close(): void {
    this.parentNode?.removeChild(this)
  }
}

export const overlayId = 'vite-plugin-checker-error-overlay'
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay)
}
