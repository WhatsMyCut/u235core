const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const uuid = require('node-uuid')
const crypto = require('crypto')

const generateApiKeyValue = () => {
  return bcrypt.genSaltAsync(10).then(salt => {
    return crypto.createHash('sha256').update(uuid.v4()).update(salt).digest('hex')
  })
}

module.exports = generateApiKeyValue
