import path from 'node:path'
import { setupGlobal } from 'sv/testing'

export default setupGlobal({
  TEST_DIR: path.resolve(import.meta.dirname, '../../.test-output'),
})
