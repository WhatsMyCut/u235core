const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt'))

const hashPassword = (password) => {
  return bcrypt.genSaltAsync(10).then(salt => bcrypt.hashAsync(password, salt))
}

module.exports = hashPassword
