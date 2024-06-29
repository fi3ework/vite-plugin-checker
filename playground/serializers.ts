import os from 'node:os'

const winNewLineReg = /\/r\/n/gim
const winSepReg = /\\/g

function doesUseDoubleSlashAsPath(val: string) {
  return val.includes('//vite-plugin-checker//')
}

function getNormalizedCwd() {
  return process
    .cwd()
    .replace(/[a-zA-Z]:\\/g, '\\')
    .replace(winSepReg, '/')
}

export const normalizeWindowsLogSerializer = {
  print(val: string, serialize) {
    let result = val
    if (os.platform() === 'win32') {
      result = result.replaceAll(winNewLineReg, '/n')
      result = result.replaceAll(getNormalizedCwd(), '<PROJECT_ROOT>')

      if (doesUseDoubleSlashAsPath(result)) {
        result = result.replaceAll(
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
      (os.platform() === 'win32' &&
        (val.includes(getNormalizedCwd()) || winNewLineReg.test(val))) ||
      doesUseDoubleSlashAsPath(val)
    ) {
      return true
    }

    return false
  },
}
