import { describe, expect, it } from 'vitest'

import { composePreambleCode, RUNTIME_CLIENT_RUNTIME_PATH } from '../src/client'

describe('composePreambleCode', () => {
  it('emits the un-based runtime specifier for the virtual entry so resolveId matches under a non-root base', () => {
    const code = composePreambleCode({
      baseWithOrigin: '/static/dist/',
      overlayConfig: {},
      useBase: false,
    })

    expect(code).toContain(
      `import { inject } from "${RUNTIME_CLIENT_RUNTIME_PATH}"`,
    )
    expect(code).not.toContain('/static/dist/@vite-plugin-checker-runtime"')
    expect(code).toContain('base: "/static/dist/"')
  })

  it('keeps the base+origin prefix for the raw HTML script', () => {
    const code = composePreambleCode({
      baseWithOrigin: '/static/dist/',
      overlayConfig: {},
    })

    expect(code).toContain(
      'import { inject } from "/static/dist/@vite-plugin-checker-runtime"',
    )
    expect(code).toContain('base: "/static/dist/"')
  })
})
