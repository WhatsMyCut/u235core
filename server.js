'use strict'
const glue = require('glue')
const fs = require('fs')

module.exports = {
  start() {
    let config = require('./config/config.js')
    let options = {
      preConnections: config.preConnections,
      preRegister: config.preRegister,
      relativeTo: fs.realpathSync('./'),
    }

    delete config.preConnections
    delete config.preRegister

    return new Promise((resolve, reject) => {
      glue.compose(config, options, (err, server) => {
        if (err) { return reject(err) }
        server.start((err) => {
          if (err) { return reject(err) }
          // Use kill -s QUIT {pid} to kill the servers gracefully
          process.once('SIGQUIT', () => {
            server.stop(() => process.exit(0))
          })
          resolve(server)
        })
      })
    })
  }
}
