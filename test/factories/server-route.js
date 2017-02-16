'use strict'

const _ = require('lodash')
const faker = require('faker')
const Hapi = require('hapi')
const Permissions = require('../../app/lib/constants/Permissions')
const mockDB = require('../factories/db')
const JWT2 = require('hapi-auth-jwt2')
const Boom = require('boom')

const bookshelf = mockDB.bookshelf
const knex = mockDB.knex
const cleanDatabase = mockDB.cleanDatabase

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
}

const scopes = {
  'user': { scope: 'user' },
  'admin': { scope: [Permissions.SYSTEM] }
}

function keyFunc(decoded, callback){
  if (decoded.apiKey){
    let key = apiKeys[decoded.apiKey]

    if (key){
      return callback(null, key)
    }
    else {
      return callback(Boom.unauthorized('Key not found'))
    }
  }
  else {
    return callback(Boom.badRequest('ApiKey was not specified in token payload'))
  }
}

function validate(decoded, request, callback){
  if (decoded.user){
    return new Promise((resolve, reject) => {
      if (decoded.user != 'getuser') {
        resolve(scopes[decoded.user])
      } else {
        const User = bookshelf.model('User')
        User.forge({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email()
        }).save()
        .then(newUser => {
          resolve({scope: [Permissions.SYSTEM], user: newUser})
        })
        .catch(err => {
          reject(err)
        })
      }
    })
    .then(user => {
      if (user){
        return callback(null, true, user)
      }
      else{
        return callback(Boom.unauthorized('User not found'));
      }
    })
    .catch(err => {
      return callback(Boom.unauthorized('User not found'));
    })
  }
  else {
    return callback(Boom.badRequest('User was not specified in token payload'))
  }
}

module.exports = {

  bookshelf,
  knex,
  cleanDatabase,

  configure(routes) {

    return () => {
      // const server = new Hapi.Server({ debug: { request: ['error'] } })
      const server = new Hapi.Server()
      server.plugins.bookshelf = bookshelf
      server.connection({})
      server.register(plugins)
      server.auth.strategy('jwt','jwt', {key: keyFunc, validateFunc: validate, verifyOptions: {algorithms: ['HS256']}})
      if (Array.isArray(routes)) {
        routes.forEach(route => server.route(_.values(route)))
      } else {
        server.route(_.values(routes))
      }
      return server
    }
  }
}
