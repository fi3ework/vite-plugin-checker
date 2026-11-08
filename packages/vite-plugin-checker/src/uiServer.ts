import fs from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const UI_PATH = '__checker'

export const uiDir = fileURLToPath(new URL('./@ui/', import.meta.url))

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

export function uiUrlFor(base: string): string {
  return `${base.endsWith('/') ? base : `${base}/`}${UI_PATH}/`
}

/**
 * Serve the diagnostics page under `{base}__checker/`.
 */
export function createUiMiddleware({
  base,
  dir,
}: {
  base: string
  dir: string
}) {
  const url = uiUrlFor(base)
  const root = path.resolve(dir)

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const [pathname = '', query] = (req.url ?? '').split('?', 2)
    if (pathname !== url.slice(0, -1) && !pathname.startsWith(url)) {
      return next()
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()

    if (!pathname.startsWith(url)) {
      res.statusCode = 302
      res.setHeader('location', query ? `${url}?${query}` : url)
      return res.end()
    }

    let relative: string
    try {
      relative = decodeURIComponent(pathname.slice(url.length)) || 'index.html'
    } catch {
      return notFound(res)
    }
    const file = path.resolve(root, relative)
    if (!file.startsWith(root + path.sep)) return notFound(res)

    let body: Buffer
    try {
      body = await fs.readFile(file)
    } catch {
      return notFound(res)
    }

    res.statusCode = 200
    res.setHeader(
      'content-type',
      contentTypes[path.extname(file)] ?? 'application/octet-stream',
    )
    res.setHeader(
      'cache-control',
      relative.startsWith('assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    )
    res.end(req.method === 'HEAD' ? undefined : body)
  }
}

function notFound(res: ServerResponse) {
  res.statusCode = 404
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.end('Not found')
}
