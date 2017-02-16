const AWS = require('aws-sdk')
const Joi = require('joi')
const Promise = require('bluebird')
const Permissions = require('../lib/constants/Permissions')

module.exports = {
  index: {
    method: 'GET',
    path: '/stored-files',
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
        query: {
          bucket: Joi.string().required(),
          key: Joi.string().required()
        },
      },
      timeout: { server: 30000 },
      handler: Promise.coroutine(function *(req, reply){
        const s3 = new AWS.S3()
        let bucket = req.query.bucket
        let key = req.query.key
        let params = { Bucket: req.query.bucket, Key: req.query.key }
        s3.getObject(params, (err, data) => {
          if (err) { return reply(Boom.wrap(err)) }
          let r = reply(data.Body)
          if (data && data.ContentDisposition) {
            r.header('content-disposition', data.ContentDisposition)
          }
        })
      })
    }
  },
}
