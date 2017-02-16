'use strict'

const Joi = require('joi')
const Promise = require('bluebird')
const _ = require('lodash')
const uuid = require('node-uuid')
const Permissions = require('../lib/constants/Permissions')
const mailer = require('../services/mailer')
const Boom = require('boom')
const UserPermissionsQuery = require('../queries/userPermissionsQuery')

module.exports = {

  show: {
    method: 'GET',
    path: '/users/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.USERS_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'User' }
      }
    }
  },

  register: {
    method: 'POST',
    path: '/users',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.USERS_CREATE]
        }
      },
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          firstName: Joi.string(),
          lastName: Joi.string(),
          password: Joi.string().required()
        }).label('User')
      },
      handler: function(request, reply) {
        let attrs = request.payload
        const User = request.db.model('User')
        new User({
          email: attrs.email,
          firstName: attrs.firstName,
          lastName: attrs.lastName
        })
          .createWithCredentialsAndApiKey({ username: attrs.email, password: attrs.password})
          .then(newUser => reply(newUser).code(201))
          .catch(err => {
            if (err.code === '23505') { // unique key violation
              return reply(Boom.conflict('User with that email already exists'))
            }
            reply(Boom.badGateway(err.message))
          })
      }
    }
  },

  update: {
    method: 'PUT',
    path: '/users/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.USERS_UPDATE]
        }
      },
      validate: {
        payload: Joi.object({
          id: Joi.number().integer(),
          firstName: Joi.string().allow(null).max(100),
          lastName: Joi.string().allow(null).max(100),
          email: Joi.string().max(100),
          phone: Joi.string().max(100)
        }).unknown().label('User'),
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiUpdate: { modelName: 'User' }
      }
    }
  },

  updateResetCode: {
    method: 'PUT',
    path: '/users/{id}/reset-code',
    config: {
      payload: {
        output: 'data',
        parse: true
      },
      tags: ['api'],
      validate: {
        payload: Joi.object().keys({
          email: Joi.string().max(100).required()
        }).label('ResetCodeRequest'),
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: Promise.coroutine(function *(request, reply) {
        let email = request.payload.email
        let User = request.db.model('User')
        let user = yield new User({ id: request.params.id, email: email })
          .fetch({ withRelated: 'credential' })
        let response

        // if the user doesnt exist, reply with no content
        // dont return an error identifying user existence
        if (user === null) {
          response = reply()
          response.code(204)
          return
        }

        // save a reset code with an expiration to the users credential
        let resetCode = uuid.v4()
        let now = new Date()

        try {
          yield user.related('credential').save({
            resetCode: resetCode,
            // 10 minutes from now
            resetExpiration: new Date(now.getTime() + 600 * 1e3)
          })
        } catch (err) {
          reply(Boom.badGateway(err.message))
          return
        }

        try {
          yield mailer.sendPasswordResetEmail(user.get('email'), resetCode)
        } catch (err) {
          reply(Boom.badGateway(err.message))
          return
        }

        response = reply()
        response.code(204)
      })
    }
  },

  updatePassword: {
    method: 'PUT',
    path: '/users/{id}/password',
    config: {
      payload: {
        output: 'data',
        parse: true
      },
      tags: ['api'],
      validate: {
        payload: Joi.object().keys({
          email: Joi.string().max(255).required(),
          password: Joi.string().max(255).required(),
          confirmPassword: Joi.string().max(255).required(),
          resetCode: Joi.string().max(255).required()
        }).label('ChangePasswordRequest'),
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: Promise.coroutine(function *(request, reply) {
        let email = request.payload.email
        let password = request.payload.password
        let confirmPassword = request.payload.confirmPassword
        let resetCode = request.payload.resetCode

        if (password !== confirmPassword) {
          reply(Boom.badRequest(new Error('Password and Confirm Password do not match')))
          return
        }

        let User = request.db.model('User')
        let user = yield new User({ id: request.params.id, email: email })
          .fetch({ withRelated: 'credential' })

        // if the user doesnt exist, reply with no content
        // dont return an error identifying user existence
        if (!user) {
          reply()
          return
        }

        let credential = user.related('credential')
        if (_.isEmpty(credential.get('resetCode'))) {
          reply(Boom.badRequest(new Error('Password reset code does not exist')))
          return
        }

        if (credential.get('resetExpiration') < Date.now()) {
          reply(Boom.badRequest(new Error('Password reset code has expired')))
          return
        }

        if (resetCode !== credential.get('resetCode')) {
          reply(Boom.badRequest(new Error('Invalid reset code')))
          return
        }

        try {
          yield user.updatePassword(password)
          reply()
        } catch (err) {
          reply(Boom.badGateway(err.message))
        }
      })
    }
  },

  permissions: {
    method: 'GET',
    path: '/users/{id}/permissions',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.USERS_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      // $lab:coverage:off$
      // covered by integration tests
      handler: Promise.coroutine(function *(req, reply) {
        let User = req.db.model('User')
        let knex = req.db.knex
        let u = yield User.forge({ id: req.params.id }).fetch()
        if (!u) { return reply(Boom.notFound('User does not exist')) }
        try {
          let query = new UserPermissionsQuery(knex, u.id)
          let permissions = yield query.fetch()
          reply(permissions)
        } catch (err) {
          reply(Boom.wrap(err))
        }
      })
      // $lab:coverage:on$
    }
  },

}
