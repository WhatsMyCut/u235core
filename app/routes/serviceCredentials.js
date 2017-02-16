'use strict'

const Joi = require('joi')
const Boom = require('boom')
const uuid = require('node-uuid')
const crypto = require('crypto')
const Permissions = require('../lib/constants/Permissions')

const encrypt = (text, password) => {
  let cipher = crypto.createCipher('aes-256-ctr', password)
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
}

module.exports = {
  show: {
    method: 'GET',
    path: '/service-credentials',
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
        query: Joi.object().keys({
          key: Joi.string().max(2048)
        })
      },
      handler: {
        apiIndex: {
          collectionName: 'ServiceCredentials',
          fetchOptions: {
            columns: [
              'id',
              'key',
              'description',
              'created_at',
              'updated_at'
            ]
          }
        }
      }
    }
  },
  create: {
    method: 'POST',
    path: '/service-credentials',
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
          description: Joi.string().max(2048).required()
        }).label('ServiceCredential')
      },
      handler(req, reply) {
        let ServiceCredential = req.db.model('ServiceCredential')
        let key = uuid.v4()
        let secret = uuid.v4()
        let encryptedSecret = encrypt(secret, process.env.SERVICE_SECRET_ENCRYPTION_KEY)

        ServiceCredential.forge({
          key: key,
          secret: encryptedSecret,
          description: req.payload.description
        }).save().then(s => {
          // initial reply with the unencrypted secret
          let response = Object.assign({}, s.attributes, { secret })
          reply(response)
        }).catch(err => {
          reply(Boom.wrap(err))
        })
      }
    }
  },

}
