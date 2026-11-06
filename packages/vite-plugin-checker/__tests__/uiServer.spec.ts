import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createUiMiddleware, uiUrlFor } from '../src/uiServer'

let dir: string

beforeAll(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vpc-ui-'))
  dir = path.join(root, 'ui')
  await fs.mkdir(path.join(dir, 'assets'), { recursive: true })
  await fs.writeFile(path.join(dir, 'index.html'), '<!doctype html>')
  await fs.writeFile(path.join(dir, 'assets/app.js'), 'export {}')
  await fs.writeFile(path.join(root, 'secret.txt'), 'secret')
})

afterAll(async () => {
  await fs.rm(path.dirname(dir), { recursive: true, force: true })
})

async function request(url: string, { base = '/app/', method = 'GET' } = {}) {
  const middleware = createUiMiddleware({ base, dir })
  const headers: Record<string, string> = {}
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      headers[name] = value
    },
    end(body?: unknown) {
      this.body = body
    },
  }
  const next = vi.fn()
  await middleware({ url, method } as any, res as any, next)
  return {
    next,
    status: res.statusCode,
    headers,
    body: res.body === undefined ? undefined : String(res.body),
  }
}

describe('uiUrlFor', () => {
  it('appends the page path to the base', () => {
    expect(uiUrlFor('/')).toBe('/__checker/')
    expect(uiUrlFor('/app/')).toBe('/app/__checker/')
    expect(uiUrlFor('/app')).toBe('/app/__checker/')
  })
})

describe('createUiMiddleware', () => {
  it('serves index.html at the page root', async () => {
    const res = await request('/app/__checker/?theme=dark')
    expect(res).toMatchObject({ status: 200, body: '<!doctype html>' })
    expect(res.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(res.headers['cache-control']).toBe('no-cache')
  })

  it('serves hashed assets as immutable', async () => {
    const res = await request('/app/__checker/assets/app.js')
    expect(res).toMatchObject({ status: 200, body: 'export {}' })
    expect(res.headers['content-type']).toBe('text/javascript; charset=utf-8')
    expect(res.headers['cache-control']).toContain('immutable')
  })

  it('redirects to the trailing slash, keeping the query', async () => {
    const res = await request('/app/__checker?theme=dark')
    expect(res.status).toBe(302)
    expect(res.headers['location']).toBe('/app/__checker/?theme=dark')
  })

  it('omits the body for HEAD requests', async () => {
    const res = await request('/app/__checker/', { method: 'HEAD' })
    expect(res.status).toBe(200)
    expect(res.body).toBeUndefined()
  })

  it('passes through other paths and methods', async () => {
    for (const [url, method] of [
      ['/__checker/', 'GET'],
      ['/app/__checkerx', 'GET'],
      ['/app/src/main.ts', 'GET'],
      ['/app/__checker/', 'POST'],
    ] as const) {
      expect((await request(url, { method })).next).toHaveBeenCalledOnce()
    }
  })

  it('does not serve files outside the page directory', async () => {
    for (const url of [
      '/app/__checker/../secret.txt',
      '/app/__checker/%2e%2e/secret.txt',
      '/app/__checker/assets/%2e%2e%2f%2e%2e%2fsecret.txt',
      '/app/__checker/%E0%A4%A',
      '/app/__checker/missing.js',
    ]) {
      const res = await request(url)
      expect(res.status, url).toBe(404)
      expect(res.body).toBe('Not found')
    }
  })
})
