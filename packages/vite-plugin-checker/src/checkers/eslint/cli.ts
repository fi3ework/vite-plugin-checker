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
  fix,
  fixDryRun,
  fixType,
  global,
  ignore,
  ignorePattern,
  inlineConfig,
  parser,
  parserOptions,
  plugin,
  quiet,
  rule,
}: any) {
  return {
    allowInlineConfig: inlineConfig,
    cache,
    cacheLocation: cacheLocation || cacheFile,
    cacheStrategy,
    errorOnUnmatchedPattern,
    fix: (fix || fixDryRun) && (quiet ? quietFixPredicate : true),
    fixTypes: fixType,
    ignore,
    overrideConfig: {
      languageOptions: {
        globals:
          // @ts-expect-error
          global?.reduce((obj, name) => {
            if (name.endsWith(':true')) {
              obj[name.slice(0, -5)] = 'writable'
            } else {
              obj[name] = 'readonly'
            }
            return obj
          }, {}) || {},
        parser,
        parserOptions,
      },
      ignores: ignorePattern || [],
      plugins: plugin || {},
      rules: rule || {},
    },
    overrideConfigFile: config,
  }
}

//extensions
