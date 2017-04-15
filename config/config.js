'use strict'
const path = require('path')
require('dotenv').config({ path: '.env.dev' })
const Confidence = require('confidence')
const env = process.env.NODE_ENV
const _ = require('lodash')
const Pack = require('../package')
const knex = require('../knexfile')
const {
  createLogger,
  HapiLoggerPlugin
} = require('u235logger')
const logger = createLogger()

// setup AWS configuration
const AWS = require('aws-sdk')
AWS.config = Object.assign({}, AWS.config, {
  region: 'us-east-1',
  correctClockSkew: true
})

const store = new Confidence.Store({
  connections: [{
    port: {
      $filter: 'env',
      $default: 8000,
      production: process.env.PORT,
      development: process.env.PORT,
      staging: process.env.PORT,
      testing: process.env.PORT
    },
    router: { stripTrailingSlash: true },
    routes: {
      timeout: { server: 15000 },
      cors: { credentials: true }
    }
  }],
  server: {
    debug: { request: ['error'] },
    connections: { state: { strictHeader: false } }
  },
  registrations: [
    {
      plugin: {
        register: 'hapi-bookshelf-models',
        options: {
          knex: knex,
          plugins: ['registry', 'visibility', 'virtuals'],
          models: 'app/models/!(base.js)',
          collections: 'app/collections/!(base.js)',
          base: {
            model: require('../app/models/base'),
            collection: require('../app/collections/base')
          }
        }
      }
    },
    { plugin: './app/plugins/db' },
    { plugin: './app/plugins/heapdump' },
    { plugin: './app/plugins/error-data' },
    { plugin: 'hapi-auth-jwt2' },
    { plugin: 'hapi-qs' },
    {
      plugin: {
        register: './app/plugins/auth-jwt',
        options: {
          keyModelName: 'ApiKey',
          userModelName: 'User',
          roleModelName: 'Role',
          userRoleModelName: 'UserRole',
          strategies: [{
            name: 'jwt',
            strategy: 'jwt',
            config: {
              verifyOptions: {algorithms: ['HS256']}
            }
          }]
        }
      }
    },
    {
      plugin: {
        register: './app/plugins/swagger',
        options: {
          info: {
            'title': 'Reactor U235 Core API',
            'version': Pack.version,
          },
          securityDefinitions: {
            token: {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header'
            }
          }
        }
      }
    },
    { plugin: './app/plugins/startup' },
    { plugin: './app/plugins/okcomputer' },
    { plugin: './app/plugins/api-route' },
    { plugin: './app/plugins/api-history-log' },
    {
      plugin: {
        register: './app/plugins/route-loader',
        options: {
          pattern: 'app/routes/**/*.js',
        }
      }
    }
  ],
  preRegister(server, next) {
    // manually register the logging plugin to work around integration issues
    // with confidence store and rejoice being unable to handle circular references
    // in objects
    server.register({
      register: require('good'),
      options: {
        reporters: {
          console: [new HapiLoggerPlugin(logger)]
        }
      }
    }, (err) => {
      if (err) { console.error(err) }
      next()
    })
  }
})

const filter = { env: env }

module.exports = store.get('/', filter)
