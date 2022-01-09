/* eslint-disable */

// Copied from /eslint@7.28.0/node_modules/eslint/lib/cli.js

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
}) {
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
        env.reduce((obj, name) => {
          obj[name] = true
          return obj
        }, {}),
      globals:
        global &&
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
