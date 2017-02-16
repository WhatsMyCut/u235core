'use strict'

exports.register = function(server, options, next) {

  server.route({
    method: 'GET',
    path: '/okcomputer',
    handler: (request, reply) => {

      reply('default: OKComputer Site Check Passed')
    }
  })

  next()
}

exports.register.attributes = {
  name: 'okcomputer',
  version: '1.0.0'
}
