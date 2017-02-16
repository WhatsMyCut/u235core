'use strict'

const Joi = require('joi')
const Permissions = require('../lib/constants/Permissions')

const payloadShape = Joi.object().keys({
  id: Joi.number().integer(),
  from: Joi.string().max(255).required(),
  to: Joi.string().max(255).required(),
  userId: Joi.number().integer().required(),
  commentId: Joi.number().integer(),
  entityId: Joi.number().integer(),
  entity: Joi.string().max(1024)
})

module.exports = {

  show: {
    method: 'GET',
    path: '/histories/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.HISTORIES_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'History' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/histories',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.HISTORIES_READ]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'Histories'
        }
      }
    }
  }
}
