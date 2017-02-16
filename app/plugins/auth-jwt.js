'use strict'

const Boom = require('boom')
const crypto = require('crypto')
const UserPermissionsQuery = require('../queries/userPermissionsQuery')
const Permissions = require('../lib/constants/Permissions')

const decrypt = (text, password) => {
  let decipher = crypto.createDecipher('aes-256-ctr', password)
  return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8')
}

exports.register = function(server, options, next) {

  function getKey(decoded, callback) {
    if (decoded && decoded.bearerType === 'service') {
      const ServiceCredential = server.db().model('ServiceCredential')

      // fetch the service record and call the callback with the services secret
      ServiceCredential.forge({ key: decoded.serviceKey }).fetch().then(sc => {
        if (!sc) { return callback(Boom.badRequest('Invalid credentials')) }
        callback( null, decrypt(sc.get('secret'), process.env.SERVICE_SECRET_ENCRYPTION_KEY) )
      }).catch(err => callback(Boom.wrap(err), false))

    } else if (decoded && decoded.bearerType === 'user') {
      const ApiKey = server.db().model(options.keyModelName)

      ApiKey.forge({ apiKey: decoded.apiKey }).fetch().then(model => {
        if (!model) { return callback(Boom.badRequest('API key does not exist for user')) }
        callback(null, model.get('apiSecret'))
      }).catch(err => callback(Boom.wrap(err), false))
    } else {
      return callback(Boom.badRequest('Key was not specified in token payload'))
    }
  }

  function validate(decoded, request, callback) {

    if (decoded && decoded.bearerType === 'user') {
      if (!decoded.id) {
        return callback(Boom.badRequest('Token missing id field'))
      }

      const User = server.db().model(options.userModelName)
      const bookshelf = server.db()
      const knex = bookshelf.knex

      User.forge({ id: decoded.id }).fetch().then(user => {
        const query = new UserPermissionsQuery(knex, user.id)
        return query.fetch().then(permissions => {
          let scope = permissions.map(p => `${p.resource}.${p.action}`)
          const credentials = { user, scope }
          callback(null, true, credentials)
        })
      }).catch(err => callback(Boom.wrap(err), false))

    } else if (decoded && decoded.bearerType === 'service') {
      const ServiceCredential = server.db().model('ServiceCredential')

      // fetch the service record and call the callback with the services secret
      ServiceCredential.forge({ key: decoded.serviceKey }).fetch().then(sc => {
        if (!sc) { return callback(Boom.badRequest('Invalid credentials')) }
        const credentials = { scope: [Permissions.SYSTEM] }
        callback(null, true, credentials)
      }).catch(err => callback(Boom.wrap(err), false))
    } else {
      return callback(Boom.badRequest('Id was not specified in token payload'))
    }
  }

  // register this plugin as an authentication strategy
  options.strategies.forEach(opt => {
    opt.config.validateFunc = validate
    opt.config.key = getKey
    server.auth.strategy(opt.name, opt.strategy, opt.config)
  })

  if (options.defaultStrategy) {
    server.auth.default(options.defaultStrategy)
  }

  next()
}

exports.register.attributes = {
    name: 'auth-jwt',
    version: '1.0.0'
}
