import { diagnosticToTerminalLog } from '../../src/logger'
import { error1 as eslintError1, warning1 as eslintWarning1 } from './fixtures/eslintDiagnostic'
import strip from 'strip-ansi'

describe('logger', () => {
  describe('diagnosticToTerminalLog', () => {
    it('get error', () => {
      const receive = strip(diagnosticToTerminalLog(eslintError1, 'ESLint'))
      expect(receive).toMatchSnapshot()
    })

    it('get warning', () => {
      const receive = strip(diagnosticToTerminalLog(eslintWarning1, 'ESLint'))
      expect(receive).toMatchSnapshot()
    })
  })
})
