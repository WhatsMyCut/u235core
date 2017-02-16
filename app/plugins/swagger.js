'use strict'

exports.register = function(server, options, next) {

    server.register([
        require('inert'),
        require('vision'),
        {
            'register': require('hapi-swagger'),
            'options': options
        }])

    next()
}

exports.register.attributes = {
    name: 'swagger',
    version: '1.0.0'
}
