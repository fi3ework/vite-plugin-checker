// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
  // **optional** default: `{}`
  // override vscode settings
  // Notice: It only affects the settings used by Vetur.
  settings: {
    'vetur.useWorkspaceDependencies': true,
    'vetur.experimental.templateInterpolationService': true,
  },
  // **optional** default: `[{ root: './' }]`
  // support monorepos
  projects: ['./playground/vue2-vls', './temp/vue2-vls'],
}
