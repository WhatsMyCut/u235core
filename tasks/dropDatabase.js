'use strict'
const knex = require('knex')(require('../knexfile'))
const cleaner = require('knex-cleaner/lib/knex_tables')

let resetDatabase = () => {
  console.log('Dropping database tables')
  return cleaner.getTableNames(knex)
  .then(tables => cleaner.getDropTables(knex, tables))
  .then(() => {
    console.log('Done!')
    return knex.destroy()
  })
  .catch(err => {
    console.log('Error deleting database tables', err)
  })
}

resetDatabase()
