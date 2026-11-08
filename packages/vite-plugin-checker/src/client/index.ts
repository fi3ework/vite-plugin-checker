import fs from 'node:fs'
import { createRequire } from 'node:module'
import { PAGE_MARKER } from '../protocol.js'
import type { OverlayOptions } from './options.js'

const _require = createRequire(import.meta.url)

export const OVERLAY_PATH = '/@vite-plugin-checker/overlay'
export const OVERLAY_ENTRY_PATH = '/@vite-plugin-checker/overlay-entry'

export const wrapVirtualPrefix = (id: `/${string}`): `virtual:${string}` =>
  `virtual:${id.slice('/'.length)}`

export const composeOverlayEntryCode = (options: OverlayOptions) => `
import { mount } from "${OVERLAY_PATH}";
const options = ${JSON.stringify(options)};
options.uiUrl = new URL(options.uiUrl, import.meta.url).href;
mount(import.meta.hot, options);
`

export const composeClientInjectionCode = () =>
  `if (typeof document !== "undefined" && !globalThis.${PAGE_MARKER}) import("${OVERLAY_ENTRY_PATH}");`

export const readOverlayCode = () =>
  fs.readFileSync(_require.resolve('../@runtime/main.js'), 'utf-8')
