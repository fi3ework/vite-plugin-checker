import os from 'node:os'

const winPathReg = /(\/)?(\D:\/)?\D\/vite-plugin-checker\/vite-plugin-checker\/playground-temp/im
const winNewLineReg = /\/r\/n/gim

function doesUseDoubleSlashAsPath(val: string) {
  return val.includes('//vite-plugin-checker//')
}

export const normalizeWindowsLogSerializer = {
  print(val, serialize) {
    let result = val
    if (os.platform() === 'win32') {
      result = result.replace(winNewLineReg, '/n')

      if (winPathReg.test(result)) {
        result = result.replace(winPathReg, '<PROJECT_ROOT>/playground-temp')
      }

      if (doesUseDoubleSlashAsPath(result)) {
        result = result.replace(
          `//a//vite-plugin-checker//vite-plugin-checker//playground-temp`,
          '<PROJECT_ROOT>/playground-temp'
        )
        result = result.split('//').join('/')
      }
    }

    return serialize(result)
  },
  test(val) {
    if (typeof val !== 'string') return false

    if (
      (os.platform() === 'win32' && (winPathReg.test(val) || winNewLineReg.test(val))) ||
      doesUseDoubleSlashAsPath(val)
    ) {
      return true
    }

    return false
  },
}
