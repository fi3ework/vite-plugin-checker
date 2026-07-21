import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parentPort } from 'node:worker_threads'
import colors from 'picocolors'
import invariant from 'tiny-invariant'
import type * as typescript from 'typescript'

import { Checker } from '../../Checker.js'
import { createFrame } from '../../codeFrame.js'
import {
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  ensureCall,
  type NormalizedDiagnostic,
  normalizeTsDiagnostic,
  toClientPayload,
  wrapCheckerSummary,
} from '../../logger.js'
import {
  ACTION_TYPES,
  type CreateDiagnostic,
  DiagnosticLevel,
  type DiagnosticToRuntime,
} from '../../types.js'
import { forceNoEmitOnSolutionBuilderHost } from '../tscUtils.js'

const __filename = fileURLToPath(import.meta.url)
let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<'typescript'> = (pluginConfig) => {
  let overlay = true
  let terminal = true
  let currDiagnostics: DiagnosticToRuntime[] = []

  return {
    config: async ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    async configureServer({ root }) {
      invariant(pluginConfig.typescript, 'config.typescript should be `false`')
      const finalConfig =
        pluginConfig.typescript === true
          ? {
              root,
              tsconfigPath: 'tsconfig.json',
              typescriptPath: 'typescript',
            }
          : {
              root: pluginConfig.typescript.root ?? root,
              tsconfigPath:
                pluginConfig.typescript.tsconfigPath ?? 'tsconfig.json',
              typescriptPath:
                pluginConfig.typescript.typescriptPath ?? 'typescript',
            }

      let configFile: string | undefined
      const ts: typeof typescript = await import(
        finalConfig.typescriptPath
      ).then((r) => r.default || r)

      // TS v7 (Corsa) removed the entire ts namespace from the root import.
      // `ts.sys`, `ts.findConfigFile()`, `ts.createWatchCompilerHost()`, etc.
      // are gone. Fall back to spawning `tsc --noEmit --watch` as a child
      // process and parse its stdout for diagnostics.
      const isTsV7 = !ts.sys

      if (isTsV7) {
        const { spawn } = await import('node:child_process')
        const { existsSync, readFileSync } = await import('node:fs')
        const { createRequire } = await import('node:module')
        const { stripVTControlCharacters: strip } = await import('node:util')

        const tsconfigPath = path.resolve(
          finalConfig.root,
          finalConfig.tsconfigPath,
        )
        if (!existsSync(tsconfigPath)) {
          throw new Error(`Failed to find tsconfig.json: ${tsconfigPath}`)
        }

        const isBuildMode =
          typeof pluginConfig.typescript === 'object' &&
          pluginConfig.typescript.buildMode
        const args = [
          ...(isBuildMode ? ['-b'] : ['--noEmit']),
          '--watch',
          '--pretty',
          'false',
        ]
        // In build mode the project path is a positional argument to `-b`;
        // `tsc -b -p <path>` is rejected. Non-build mode uses `-p`.
        if (isBuildMode) {
          args.push(tsconfigPath)
        } else {
          args.push('-p', tsconfigPath)
        }

        let tscBin = 'tsc'
        let runWithNode = false
        try {
          const requireFromRoot = createRequire(
            path.join(finalConfig.root, 'noop.js'),
          )
          const tsPkgJson = requireFromRoot.resolve(
            `${finalConfig.typescriptPath}/package.json`,
          )
          tscBin = path.join(path.dirname(tsPkgJson), 'bin', 'tsc')
          runWithNode = existsSync(tscBin)
        } catch {}

        const tscProcess = runWithNode
          ? spawn(process.execPath, [tscBin, ...args], {
              cwd: finalConfig.root,
            })
          : spawn(tscBin, args, { cwd: finalConfig.root, shell: true })

        let logChunk = ''

        // Buffer partial lines across `data` chunks; tsc may split a line
        // (or a multi-line diagnostic) across chunk boundaries.
        let stdoutBuffer = ''
        // Accumulates continuation lines of a multi-line diagnostic message.
        let pendingDiag: NormalizedDiagnostic | null = null

        const flushPendingDiag = () => {
          if (!pendingDiag) return
          currDiagnostics.push(diagnosticToRuntimeError(pendingDiag))
          logChunk +=
            os.EOL + diagnosticToTerminalLog(pendingDiag, 'TypeScript')
          pendingDiag = null
        }

        const handleLine = (rawLine: string) => {
          // Strip \r and timestamp prefix that tsc --watch prepends to each line
          const line = rawLine
            .replace(/\r$/, '')
            .replace(/^\d{1,2}:\d{2}:\d{2}\s+[AP]M\s+-\s+/, '')

          // Parse: "<file>(<line>,<col>): error TS<code>: <message>"
          // This is the --pretty false format; the pretty format uses
          // "<file>:<line>:<col> - error TS<code>: <message>" instead.
          const diagMatch = line.match(
            /^(.+?)\((\d+),(\d+)\): (error|warning) TS(\d+): (.+)$/,
          )
          if (diagMatch) {
            flushPendingDiag()
            const [, file, lineStr, colStr, severity, tsCode, message] =
              diagMatch
            const lineNum = +lineStr!
            const colNum = +colStr!

            // tsc outputs paths relative to its cwd (finalConfig.root);
            // resolve to absolute so readFileSync works in the worker thread
            const absFile = path.resolve(finalConfig.root, file!)

            let codeFrame: string | undefined
            let stripedCodeFrame: string | undefined
            if (existsSync(absFile)) {
              try {
                const source = readFileSync(absFile, 'utf-8')
                codeFrame = createFrame(source, {
                  start: { line: lineNum, column: colNum },
                })
                stripedCodeFrame = strip(codeFrame)
              } catch {}
            }

            pendingDiag = {
              message: `TS${tsCode}: ${message}`,
              conclusion: '',
              id: absFile,
              checker: 'TypeScript',
              codeFrame,
              stripedCodeFrame,
              loc: {
                start: { line: lineNum, column: colNum },
              },
              level:
                severity === 'warning'
                  ? DiagnosticLevel.Warning
                  : DiagnosticLevel.Error,
            }
            return
          }

          // Parse: "Found X errors." or "Found X errors. Watching for file changes."
          const summaryMatch = line.match(/Found (\d+) errors?\./)
          if (summaryMatch) {
            flushPendingDiag()
            const errorCount = +summaryMatch[1]!
            if (overlay) {
              parentPort?.postMessage({
                type: ACTION_TYPES.overlayError,
                payload: toClientPayload('typescript', currDiagnostics),
              })
            }
            // Capture logChunk before resetting; ensureCall defers via setTimeout
            const capturedLogChunk = logChunk
            ensureCall(() => {
              if (terminal) {
                const color = errorCount > 0 ? 'red' : 'green'
                consoleLog(
                  colors[color](
                    (errorCount > 0 ? capturedLogChunk : '') +
                      os.EOL +
                      wrapCheckerSummary(
                        'TypeScript',
                        errorCount > 0
                          ? `Found ${errorCount} error(s)`
                          : 'No errors',
                      ),
                  ),
                  errorCount > 0 ? 'error' : 'info',
                )
              }
            })
            logChunk = ''
            currDiagnostics = []
            return
          }

          // A non-empty, non-summary line while a diagnostic is open is a
          // continuation of its (multi-line) message.
          if (pendingDiag && line.trim() !== '') {
            pendingDiag.message += os.EOL + line
          }
        }

        tscProcess.stdout.on('data', (chunk: Buffer) => {
          stdoutBuffer += chunk.toString()
          const lines = stdoutBuffer.split('\n')
          stdoutBuffer = lines.pop() ?? ''
          for (const rawLine of lines) handleLine(rawLine)
        })

        tscProcess.stderr.on('data', (chunk: Buffer) => {
          consoleLog(colors.red(chunk.toString()), 'error')
        })

        tscProcess.on('error', (err: Error) => {
          consoleLog(
            colors.red(`TypeScript checker failed: ${err.message}`),
            'error',
          )
        })

        const killTsc = () => {
          tscProcess.kill()
        }
        parentPort?.on('close', killTsc)
        process.on('exit', killTsc)

        return
      }

      configFile = ts.findConfigFile(
        finalConfig.root,
        ts.sys.fileExists,
        finalConfig.tsconfigPath,
      )

      if (configFile === undefined) {
        throw Error(
          `Failed to find a valid tsconfig.json: ${finalConfig.tsconfigPath} at ${finalConfig.root} is not a valid tsconfig`,
        )
      }

      let logChunk = ''

      // https://github.com/microsoft/TypeScript/blob/a545ab1ac2cb24ff3b1aaf0bfbfb62c499742ac2/src/compiler/watch.ts#L12-L28
      const reportDiagnostic = (diagnostic: typescript.Diagnostic) => {
        const normalizedDiagnostic = normalizeTsDiagnostic(diagnostic)
        if (normalizedDiagnostic === null) {
          return
        }

        currDiagnostics.push(diagnosticToRuntimeError(normalizedDiagnostic))
        logChunk +=
          os.EOL + diagnosticToTerminalLog(normalizedDiagnostic, 'TypeScript')
      }

      const reportWatchStatusChanged: typescript.WatchStatusReporter = (
        diagnostic,
        _newLine,
        _options,
        errorCount,
        // eslint-disable-next-line max-params
      ) => {
        if (diagnostic.code === 6031) return
        // https://github.com/microsoft/TypeScript/issues/32542
        // https://github.com/microsoft/TypeScript/blob/dc237b317ed4bbccd043ddda802ffde00362a387/src/compiler/diagnosticMessages.json#L4086-L4088
        switch (diagnostic.code) {
          case 6031:
          case 6032:
            // clear current error and use the newer errors
            logChunk = ''
            // currErr = null
            currDiagnostics = []
            return
          case 6193: // 1 Error
          case 6194: // 0 errors or 2+ errors
            if (overlay) {
              parentPort?.postMessage({
                type: ACTION_TYPES.overlayError,
                payload: toClientPayload('typescript', currDiagnostics),
              })
            }
        }

        ensureCall(() => {
          if (errorCount === 0) {
            logChunk = ''
          }

          if (terminal) {
            const color = errorCount && errorCount > 0 ? 'red' : 'green'
            consoleLog(
              colors[color](
                logChunk +
                  os.EOL +
                  wrapCheckerSummary(
                    'TypeScript',
                    diagnostic.messageText.toString(),
                  ),
              ),
              errorCount ? 'error' : 'info',
            )
          }
        })
      }

      // https://github.com/microsoft/TypeScript/issues/32385
      // https://github.com/microsoft/TypeScript/pull/33082/files
      const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram

      if (
        typeof pluginConfig.typescript === 'object' &&
        pluginConfig.typescript.buildMode
      ) {
        const host = forceNoEmitOnSolutionBuilderHost(
          ts,
          ts.createSolutionBuilderWithWatchHost(
            ts.sys,
            createProgram,
            reportDiagnostic,
            undefined,
            reportWatchStatusChanged,
          ),
        )

        ts.createSolutionBuilderWithWatch(host, [configFile], {}).build()
      } else {
        const host = ts.createWatchCompilerHost(
          configFile,
          { noEmit: true },
          ts.sys,
          createProgram,
          reportDiagnostic,
          reportWatchStatusChanged,
        )

        ts.createWatchProgram(host)
      }
    },
  }
}

export class TscChecker extends Checker<'typescript'> {
  public constructor() {
    super({
      name: 'typescript',
      absFilePath: __filename,
      build: {
        buildBin: (config) => {
          if (typeof config.typescript === 'object') {
            const {
              root = '',
              tsconfigPath = '',
              buildMode,
            } = config.typescript

            // Compiler option '--noEmit' may not be used with '--build'
            const args = [buildMode ? '-b' : '--noEmit']

            // Custom config path
            let projectPath = ''
            if (root || tsconfigPath) {
              projectPath = root ? path.join(root, tsconfigPath) : tsconfigPath
            }

            if (projectPath) {
              // In build mode, the tsconfig path is an argument to -b, e.g. "tsc -b [path]"
              if (buildMode) {
                args.push(projectPath)
              } else {
                args.push('-p', projectPath)
              }
            }

            return ['tsc', args]
          }

          return ['tsc', ['--noEmit']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    const _createServeAndBuild = super.initMainThread()
    createServeAndBuild = _createServeAndBuild
    super.initWorkerThread()
  }
}

export { createServeAndBuild }

const tscChecker = new TscChecker()
tscChecker.prepare()
tscChecker.init()
