'use strict'

const Boom = require('boom')
const _ = require('lodash')

exports.register = function(server, options, next) {

  // register this plugin as an authentication strategy
  server.ext({
    type: 'onRequest',
    method(req, reply) {
      // Redirect multipart/form-data requests to the correct route handler that will handle file streaming
      // This appears to be on only possible way to make a request to a single URL and allow different
      // input formats with the Hapi framework
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        options.routes.forEach(opt => {
          let re = new RegExp(opt.source)
          let match = req.path.match(re)

          if (match) {
            req.setUrl(req.path.replace(re, opt.redirect))
          }
        })
      }

      return reply.continue()
    }
  })

  next()
}

exports.register.attributes = {
    name: 'api-multipart',
    version: '1.0.0'
}
