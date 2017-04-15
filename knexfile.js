// $lab:coverage:off$
const Confidence = require('confidence')
const env = process.env.NODE_ENV
const databaseUrl = process.env.DATABASE_URL
const testDatabaseUrl = process.env.DATABASE_URL_TEST
const debugKnex = process.env.DEBUG_KNEX ? true : false
const store = new Confidence.Store({

  client: 'pg',
  connection: {
    $filter: 'env',
    development: databaseUrl,
    production: databaseUrl,
    staging: databaseUrl,
    testing: databaseUrl,
    test: testDatabaseUrl,
    $default: {
      database: {
        $filter: 'env',
        $default: 'u235core',
        test: 'u235core'
      },
      host: 'localhost',
      port: 5433,
      user: {
        $filter: 'env',
        $default: 'u235core',
        test: 'u235core'
      },
      password: {
        $filter: 'env',
        $default: 'u235coredbpassword',
        test: 'u235coredbpassword'
      }
    }
  },
  debug: debugKnex,
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './db/seeds'
  }

})

const filter = { env: env }

module.exports = store.get('/', filter)
  // $lab:coverage:on$
