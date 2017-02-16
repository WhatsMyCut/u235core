'use strict'

const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt'))
const hashPassword = require('../lib/hashPassword')
const generateApiKeyValue = require('../lib/generateApiKeyValue')

module.exports = function(base, bookshelf) {
  // $lab:coverage:off$

  return base.extend({

    tableName: 'users',

    roles() {
      return this.belongsToMany('Role').through('UserRole', 'user_id', 'role_id')
    },

    credential() {
      return this.belongsTo('Credential')
    },

    apiKey() {
      return this.hasOne('ApiKey').where({ active: true })
    },

    isValidPassword(password) {
      if (!password) { return Promise.resolve(false) }
      return this.related('credential').fetch().then(credentials => {
        let passwordHash = credentials.get('passwordHash')
        return bcrypt.compareAsync(password, passwordHash)
      })
    },

    updatePassword(newPassword) {
      return this.related('credential').fetch().then(credential => {
        return hashPassword(newPassword).then(passwordHash => {
          return credential.save({
            passwordHash,
            resetExpiration: null,
            resetCode: null
          }).then(() => this)
        })
      })
    },

    createWithCredentialsAndApiKey(attrs) {
      const ApiKey = bookshelf.model('ApiKey')
      const Credential = bookshelf.model('Credential')

      return bookshelf.transaction((t) => {
        // hash the password and save user credentials
        return hashPassword(attrs.password).then(passwordHash => {
          return new Credential({ username: attrs.username, passwordHash }).save(null, { transacting: t })
        }).then(credential => {
          // save the user itself and generate credentials for the api key
          return Promise.props({
            newUser: this.save({ credentialId: credential.get('id') }, { transacting: t }),
            apiKey: generateApiKeyValue(),
            apiSecret: generateApiKeyValue()
          })
        }).then(result => {
          return new ApiKey({}).save({
            userId: result.newUser.get('id'),
            active: true,
            apiKey: result.apiKey,
            apiSecret: result.apiSecret
          }, { transacting: t })
            .then(() => result.newUser)
        })
      })
    }
  }, {
    // static methods
  })
  // $lab:coverage:on$
}
