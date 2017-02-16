'use strict'

exports.register = function(server, options, next) {
  // allow sending `kill -USR2 pid` to process to generate a heapdump
  require('heapdump')
  next()
}

exports.register.attributes = {
  name: 'heapdump',
  version: '1.0.0'
}
