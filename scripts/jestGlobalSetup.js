const path = require('path')

module.exports = () => {
  process.env.JEST_ROOT_DIR = path.resolve(__dirname, '../')
}
