'use strict'

const Joi = require('joi')
const Permissions = require('../lib/constants/Permissions')

module.exports = {

  show: {
    method: 'GET',
    path: '/field-groups/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.FIELD_GROUPS_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'FieldGroup' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/field-groups',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.FIELD_GROUPS_READ]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'FieldGroups'
        }
      }
    }
  }

}
