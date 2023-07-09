import type { VlsOptions } from './initParams.js'

export type VlsConfig = boolean | DeepPartial<VlsOptions>

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}
