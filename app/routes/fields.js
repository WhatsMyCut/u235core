'use strict'

const Joi = require('joi')
const Promise = require('bluebird')
const Permissions = require('../lib/constants/Permissions')

module.exports = {

  show: {
    method: 'GET',
    path: '/fields/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.FIELDS_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'Field' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/fields',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.FIELDS_READ]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'Fields'
        }
      }
    }
  },

  schema: {
    method: 'GET',
    path: '/fields/schema',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.FIELDS_READ]
        }
      },
      handler: Promise.coroutine(function *(req, reply){
        let db = req.db
        let Field = db.model('Field')
        let FieldGroup = db.model('FieldGroup')
        let results = yield Promise.all([
          Field.fetchAll(),
          FieldGroup.fetchAll()
        ])
        let fields = results[0]
        let fieldGroups = results[1]

        let schema = fieldsToSchema({
          fields: fields.toJSON(),
          fieldGroups: fieldGroups.toJSON(),
          programFields: [],
          details: [],
        })

        reply({ schema })
      })
    }
  },

}
