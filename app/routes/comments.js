'use strict'

const Joi = require('joi')
const Permissions = require('../lib/constants/Permissions')

const payloadShape = Joi.object().keys({
  id: Joi.number().integer(),
  comment: Joi.string().max(2048).required(),
  reportedBy: Joi.number().integer().required()
}).label('SubmissionNote')

module.exports = {

  show: {
    method: 'GET',
    path: '/comments/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.COMMENTS_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'Comment' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/comments',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.COMMENTS_READ]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'Comments'
        }
      }
    }
  },

  create: {
    method: 'POST',
    path: '/comments',
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
          scope: [Permissions.SYSTEM, Permissions.COMMENTS_CREATE]
        }
      },
      validate: {
        payload: payloadShape
      },
      handler: {
        apiCreate: { modelName: 'Comment' }
      }
    }
  }
}
