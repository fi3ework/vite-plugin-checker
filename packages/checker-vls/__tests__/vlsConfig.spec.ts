import path from 'path'
import { describe, expect, it } from 'vitest'
import { ShutdownRequest } from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { prepareClientConnection, logLevel2Severity } from '../src/diagnostics.js'

async function testVslConfig(overrideConfig?: any) {
  const workspaceUri = URI.file(path.join(__dirname, 'fixtures'))
  const { clientConnection, serverConnection, vls, up, down } = await prepareClientConnection(
    workspaceUri,
    logLevel2Severity['WARN'],
    {
      watch: false,
      verbose: false,
      config: overrideConfig || null,
    }
  )

  // @ts-expect-error
  expect(vls.workspaceConfig).toMatchSnapshot()

  // TODO: this test case will let Jest hang with out --forceExit option
  // current enable forceExit but we should find which resource is not released
  await clientConnection.sendRequest(ShutdownRequest.type)
  clientConnection.dispose()
  clientConnection.end()
  serverConnection.dispose()
  up.destroy()
  down.destroy()
  vls.dispose()
}

describe('VLS config', () => {
  it('default config', async () => {
    await testVslConfig()
  })

  it('customized config', async () => {
    await testVslConfig({
      vetur: {
        validation: {
          template: false,
          templateProps: false,
          interpolation: false,
          style: false,
        },
      },
    })
  })
})
