'use strict'

const Joi = require('joi')
const Permissions = require('../lib/constants/Permissions')

module.exports = {
  // $lab:coverage:off$
  show: {
    method: 'GET',
    path: '/api-keys/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'ApiKey' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/api-keys',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'ApiKeys'
        }
      }
    }
  },

  create: {
    method: 'POST',
    path: '/api-keys',
    config: {
      payload: {
        output: 'data',
        parse: true
      },
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      validate: {
        payload: Joi.object().keys({
          id: Joi.number().integer(),
          userId: Joi.number().integer().required(),
          label: Joi.string().max(100).required(),
          apiKey: Joi.string().max(2048).empty(''),
          apiSecret: Joi.string().max(2048).empty(''),
          active: Joi.boolean()
        }).label('ApiKey')
      },
      handler: {
        apiCreate: { modelName: 'ApiKey' }
      }
    }
  },

  update: {
    method: 'PUT',
    path: '/api-keys/{id}',
    config: {
      payload: {
        output: 'data',
        parse: true
      },
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      validate: {
        payload: Joi.object().keys({
          id: Joi.number().integer(),
          userId: Joi.number().integer().required(),
          label: Joi.string().max(100).required(),
          apiKey: Joi.string().max(2048).empty(''),
          apiSecret: Joi.string().max(2048).empty(''),
          active: Joi.boolean()
        }).label('ApiKey'),
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiUpdate: { modelName: 'ApiKey' }
      }
    }
  }
  // $lab:coverage:on$
}
