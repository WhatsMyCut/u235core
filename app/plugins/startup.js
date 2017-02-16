'use strict'

exports.register = function(server, options, next) {

  server.ext('onPostStart', (server, next) => {
    // print a message for each connection
    server.connections.forEach(connection => {
      server.log('info', `Server started: ${connection.info.uri}`)
    })
    next()
  })

  server.ext('onPostStop', () => {
    server.log('info', 'Server stopped')
  })

  next()
}

exports.register.attributes = {
  name: 'startup',
  version: '1.0.0'
}
