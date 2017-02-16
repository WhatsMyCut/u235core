'use strict'
const server = require('./server')
server.start().catch(err => {
  console.log('Server failed to start', err, err.stack)
})
