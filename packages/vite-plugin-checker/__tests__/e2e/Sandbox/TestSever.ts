import { HMRPayload } from 'vite'

interface SimpleServer {
  ws: { send: (payload: HMRPayload) => void }
  middlewares: { use: (m: (_: unknown, __: unknown, next: () => unknown) => void) => void }
}

export class TestServer implements SimpleServer {
  public onSend: (payload: HMRPayload) => unknown
  public onMiddlewareUse: () => unknown

  public middlewares: SimpleServer['middlewares'] = {
    use(m) {
      const req = ''
      const res = ''
      const next = () => {}
      m(req, res, next)
    },
  }

  public ws: SimpleServer['ws'] = {
    send(payload) {
      return
    },
  }

  public constructor(options: {
    onMiddlewareUse: () => unknown
    onSend: (payload: HMRPayload) => unknown
  }) {
    this.onMiddlewareUse = options.onMiddlewareUse
    this.onSend = options.onSend
  }
}
