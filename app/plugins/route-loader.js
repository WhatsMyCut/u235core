/*
Loads and registers routes automatically.

USAGE

{
  register: require('../app/plugins/route-loader'),
  options: {
    pattern: 'app/routes/*.js'
  }
}
*/

'use strict'

const glob = require('glob')
const _ = require('lodash')
const Path = require('path')
const cwd = process.cwd()

function getRoutes(pattern) {
  let files = glob.sync(pattern)
  return files.reduce((memo, file) => {
    file = Path.join(cwd, file)
    let actions = _.values(require(file))
    return [].concat(memo, actions)
  }, [])
}

exports.register = function(server, options, next) {

  server.register([require('./api-route')], err => {
    if (err) throw err

    server.route(getRoutes(options.pattern))
  })

  next()
}

exports.register.attributes = {
  name: 'route-loader',
  dependencies: 'api-route',
  version: '1.0.0'
}
