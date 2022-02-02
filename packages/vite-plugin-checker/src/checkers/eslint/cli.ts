/* eslint-disable */

/**
 * This file is directly copied from https://github.com/eslint/eslint/blob/6f940c3ce715327f282c197d0f71b91848e5d83d/lib/cli.js
 *
 * Usually, developer rarely use JS programming API to run ESLint. So we let
 * developers to write their own ESLint commands just like in CI or lint-staged.
 * And the config will be translated and pass to `new ESLint(translatedOptions)`.
 * So in build mode, it's the same as the command you pass in.
 * In dev mode, some flag will be ignored (such as `max-warnings`) because it
 * will be only respected in ESLint CLI.
 */

// @ts-expect-error
function quietFixPredicate(message) {
  return message.severity === 2
}

export function translateOptions({
  cache,
  cacheFile,
  cacheLocation,
  cacheStrategy,
  config,
  env,
  errorOnUnmatchedPattern,
  eslintrc,
  ext,
  fix,
  fixDryRun,
  fixType,
  global,
  ignore,
  ignorePath,
  ignorePattern,
  inlineConfig,
  parser,
  parserOptions,
  plugin,
  quiet,
  reportUnusedDisableDirectives,
  resolvePluginsRelativeTo,
  rule,
  rulesdir,
}: any) {
  return {
    allowInlineConfig: inlineConfig,
    cache,
    cacheLocation: cacheLocation || cacheFile,
    cacheStrategy,
    errorOnUnmatchedPattern,
    extensions: ext,
    fix: (fix || fixDryRun) && (quiet ? quietFixPredicate : true),
    fixTypes: fixType,
    ignore,
    ignorePath,
    overrideConfig: {
      env:
        env &&
        // @ts-expect-error
        env.reduce((obj, name) => {
          obj[name] = true
          return obj
        }, {}),
      globals:
        global &&
        // @ts-expect-error
        global.reduce((obj, name) => {
          if (name.endsWith(':true')) {
            obj[name.slice(0, -5)] = 'writable'
          } else {
            obj[name] = 'readonly'
          }
          return obj
        }, {}),
      ignorePatterns: ignorePattern,
      parser,
      parserOptions,
      plugins: plugin,
      rules: rule,
    },
    overrideConfigFile: config,
    reportUnusedDisableDirectives: reportUnusedDisableDirectives ? 'error' : void 0,
    resolvePluginsRelativeTo,
    rulePaths: rulesdir,
    useEslintrc: eslintrc,
  }
}
