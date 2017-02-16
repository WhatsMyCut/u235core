'use strict'

const knex = require('knex')(require('../../knexfile'))
const knexCleaner = require('knex-cleaner')

const bookshelf = require('bookshelf')(knex)
bookshelf.plugin('registry')

const bs = {
  model: bookshelf.model.bind(bookshelf),
  collection: bookshelf.collection.bind(bookshelf)
}

bookshelf.model('Base', require('../../app/models/base')(bookshelf))
bookshelf.collection('Base', require('../../app/collections/base')(bookshelf))

bookshelf.model = modelLoader.bind(null, 'model')
bookshelf.collection = modelLoader.bind(null, 'collection')

function modelLoader(type, name) {
  name = name.charAt(0).toLowerCase() + name.slice(1)
  let Model = bs[type](name)
  if (Model) return Model

  try {
    const modelDef = require(`../../app/${type}s/${name}`)
    bs[type](name, modelDef(bs[type]('Base'), bookshelf))
  } catch (ex) {
    return null
  }
  return bs[type](name)
}

const knexCleanerOptions = {
  // There is an expectation that records exist in these tables
  // from migrations
  ignoreTables: [
    'knex_migrations',
    'osl_field_keys',
    'osl_locales',
    'osl_templates',
    'program_categories',
    'roles',
    'permissions',
    'verticals',
    'submission_methods',
    'fields',
    'field_groups',
    'catalog_fields',
    'program_document_types',
    'program_media_types'
  ]
}

function cleanDatabase() {
  return knexCleaner.clean(knex, knexCleanerOptions)
}

module.exports = {
  knex,
  cleanDatabase,
  bookshelf
}
