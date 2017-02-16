'use strict'

const Joi = require('joi')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const Boom = require('boom')
const Permissions = require('../lib/constants/Permissions')
const ldap = require('ldapjs')

function validatePasswordFromLDAP(email, password) {
  return new Promise(function(resolve) {
    let client = ldap.createClient({
      url: process.env.LDAP_URL
    })

    client.bind(email, password, function(err) {
      client.unbind(() => {})
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

module.exports = {
  create: {
    method: 'POST',
    path: '/auth-token',
    config: {
      tags: ['api'],
      payload: {
        output: 'data',
        parse: true
      },
      validate: {
        payload: Joi.object().keys({
          email: Joi.string().required(),
          password: Joi.string().required()
        })
      },
      handler: Promise.coroutine(function *(request, reply) {
        var cookieOptions = {
          ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today
          encoding: 'none',     // we already used JWT to encode
          isSecure: process.env.NODE_ENV === 'production',
          isHttpOnly: true,     // prevent client alteration
          clearInvalid: false,  // remove invalid cookies
          strictHeader: true,   // don't allow violations of RFC 6265
          domain: request.info.hostname,
          path: '/'             // set the cookie for all routes
        }

        const User = request.db.model('User')
        const Credential = request.db.model('Credential')
        let email = request.payload.email
        let password = request.payload.password
        let env = process.env.NODE_ENV

        try {
          let cred = yield Credential.forge({ username: email, active: true }).fetch()
          if (!cred) {
            return reply(Boom.badRequest('Invalid credentials'))
          }

          let user = yield User.forge({ credentialId: cred.get('id') }).fetch()
          if (!user) {
            return reply(Boom.badRequest('Invalid user'))
          }

          let isValidPassword

          env = env || 'development'
          if (env === 'development' || env === 'test') {
            isValidPassword = yield user.isValidPassword(password)
          } else {
            isValidPassword = yield validatePasswordFromLDAP(email, password)
          }

          if (!isValidPassword) {
            return reply(Boom.badRequest('Invalid password'))
          }

          let apiKey = yield user.related('apiKey').fetch()
          if (!apiKey) {
            return reply(Boom.badRequest('ApiKey doesnt exist for user'))
          }

          let secret = apiKey.get('apiSecret')
          let jwtPayload = {
            id: user.get('id'),
            apiKey: apiKey.get('apiKey'),
            bearerType: 'user',
            // 30 days
            expiresIn: 2592000
          }
          let token = JWT.sign(jwtPayload, secret)

          return reply({ token }).state('token', token, cookieOptions)
        } catch (err) {
          // $lab:coverage:off$
          return reply(Boom.wrap(err))
          // $lab:coverage:on$
        }
      })
    }
  }
}
