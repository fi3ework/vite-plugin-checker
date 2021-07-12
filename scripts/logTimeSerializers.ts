/* eslint-disable */

const readyTimeReg = /ready in \d+ms\./im
const hmrUpdateTimeReg = /\d+:\d+:\d+ [AP]M /im
const winPathReg = /(D:)?\/.?\/vite-plugin-checker\/vite-plugin-checker/im
import os from 'os'

/**
 * erase log time
 */
const logTimeSerializers = {
  // why this function is not in Jest's documentation 🤨
  print(val: any, serialize: any) {
    let result = val
    result = result.replace(readyTimeReg, 'ready in XXXms')
    result = result.replace(hmrUpdateTimeReg, 'HH:MM:SS AM ')
    if (os.platform() === 'win32') {
      result = result.replace(winPathReg, '<PROJECT_ROOT>')
    }
    return serialize(result)
  },
  test(val: any) {
    if (typeof val !== 'string') return false
    if (readyTimeReg.test(val)) return true
    if (hmrUpdateTimeReg.test(val)) return true
    if (os.platform() === 'win32' && winPathReg.test(val)) return true
    return false
  },
}

export { logTimeSerializers }
