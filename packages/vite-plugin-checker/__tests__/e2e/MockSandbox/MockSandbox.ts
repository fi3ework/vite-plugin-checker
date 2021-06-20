import { Plugin, ConfigEnv, ViteDevServer, UserConfig } from 'vite'
import { ServeAndBuildChecker } from '../../../src/types'
import { TestServer } from './TestSever'
import assert from 'assert'

export class MockSandbox {
  public plugin?: Plugin
  public checkers?: ServeAndBuildChecker[]
  public viteMock?: {
    context: any
    server: TestServer
  }

  public viteDev({ config, env }: { config: UserConfig; env: ConfigEnv }) {
    this.runConfig(config, env)
    this.runConfigureServer()
    this.runBuildStart()
  }

  public viteBuild({ config, env }: { config: UserConfig; env: ConfigEnv }) {
    this.runConfig(config, env)
    this.runBuildStart()
  }

  public runConfig: NonNullable<Plugin['config']> = (config, env) => {
    assert(this.plugin?.config, 'have this.plugin.config')
    this.plugin.config(config, env)
  }

  public runBuildStart() {
    assert(this.plugin?.buildStart, 'have this.plugin.buildStart')
    // @ts-expect-error
    this.plugin.buildStart()
  }

  public runConfigureServer() {
    assert(this.plugin?.configureServer, 'have this.plugin.configureServer')
    // @ts-expect-error
    this.plugin.configureServer(this.viteMock.server as ViteDevServer)
  }

  public reset() {
    this.viteMock = undefined
  }
}
