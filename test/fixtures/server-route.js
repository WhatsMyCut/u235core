'use strict'

const _ = require('lodash')
const Hapi = require('hapi')
const Permissions = require('../../app/lib/constants/Permissions')
const mockDB = require('../fixtures/mock-db')
const JWT2 = require('hapi-auth-jwt2')
const Boom = require('boom')

const bookshelf = mockDB.bookshelf
const tracker = mockDB.tracker

const plugins = [
  { register: require('../../app/plugins/db'), options: {} },
  { register: require('../../app/plugins/error-data'), options: {} },
  { register: require('../../app/plugins/api-route'), options: {} },
  { register: require('../../app/plugins/api-history-log'), options: {} },
  { register: JWT2, options: {} },
  { register: require('hapi-qs') }
]

const apiKeys = {
  1: 'key1',
  2: 'key2'
};

const scopes = {
  'user': { name: 'user', scope: 'user' },
  'admin': { name: 'admin', scope: [Permissions.SYSTEM] }
}

function keyFunc(decoded, callback){
  if (decoded.apiKey){
    var key = apiKeys[decoded.apiKey];

    if (key){
      return callback(null, key)
    }
    else{
      return callback(Boom.unauthorized('Key not found'));
    }
  }
  else{
    return callback(Boom.badRequest('ApiKey was not specified in token payload'));
  }
}

function validate(decoded, request, callback){
  if (decoded.user){
    var user = scopes[decoded.user];

    if (user){
      return callback(null, true, user)
    }
    else{
      return callback(Boom.unauthorized('User not found'));
    }
  }
  else{
    return callback(Boom.badRequest('User was not specified in token payload'));
  }
}

module.exports = {

  tracker,

  configure(route) {

    return () => {
      const server = new Hapi.Server({ debug: { request: ['error'] } })
      // const server = new Hapi.Server()
      server.plugins.bookshelf = bookshelf
      server.connection({})
      server.register(plugins)
      server.auth.strategy('jwt','jwt', {key: keyFunc, validateFunc : validate, verifyOptions: {algorithms: ['HS256']}})
      server.route(_.values(route))
      return server
    }
  }
}
