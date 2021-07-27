import { URI } from 'vscode-uri'

import type { InitializeParams } from 'vscode-languageserver/node'

export function getInitParams(workspaceUri: URI): InitializeParams {
  const defaultVLSConfig = getDefaultVLSConfig()

  defaultVLSConfig.vetur.validation = {
    template: true,
    style: true,
    script: true,
    interpolation: true,
    templateProps: true,
  }
  defaultVLSConfig.vetur.experimental = {
    templateInterpolationService: true,
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const init: InitializeParams = {
    rootPath: workspaceUri.fsPath,
    rootUri: workspaceUri.toString(),
    processId: process.pid,
    capabilities: {},
    initializationOptions: {
      config: defaultVLSConfig,
    },
  } as InitializeParams

  return init
}

export function getDefaultVLSConfig() {
  return {
    vetur: {
      ignoreProjectWarning: false,
      useWorkspaceDependencies: false,
      validation: {
        template: true,
        templateProps: true,
        interpolation: true,
        style: true,
        script: true,
      },
      completion: {
        autoImport: false,
        tagCasing: 'initial',
        scaffoldSnippetSources: {
          workspace: '💼',
          user: '🗒️',
          vetur: '✌',
        },
      },
      grammar: {
        customBlocks: {},
      },
      format: {
        enable: true,
        options: {
          tabSize: 2,
          useTabs: false,
        },
        defaultFormatter: {},
        defaultFormatterOptions: {},
        scriptInitialIndent: false,
        styleInitialIndent: false,
      },
      languageFeatures: {
        codeActions: true,
        updateImportOnFileMove: true,
        semanticTokens: true,
      },
      trace: {
        server: 'off',
      },
      dev: {
        vlsPath: '',
        vlsPort: -1,
        logLevel: 'INFO',
      },
      experimental: {
        templateInterpolationService: false,
      },
    },
    css: {},
    html: {
      suggest: {},
    },
    javascript: {
      format: {},
    },
    typescript: {
      tsdk: null,
      format: {},
    },
    emmet: {},
    stylusSupremacy: {},
  }
}
