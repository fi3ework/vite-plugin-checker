const fs = require('fs-extra')
const path = require('path')

module.exports = async () => {
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '../temp'))
  }
}
