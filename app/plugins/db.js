'use strict'

exports.register = function(server, options, next) {

  const db = server.plugins.bookshelf

  function getDB() { return db }

  server.decorate('server', 'db', getDB)
  server.decorate('request', 'db', getDB, { apply: true })

  next()
}

exports.register.attributes = {
  name: 'db',
  version: '1.0.0'
}
