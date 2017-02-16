'use strict'

const knex = require('knex')(require('../../knexfile'))
const mockKnex = require('mock-knex')
mockKnex.mock(knex)

const bookshelf = require('bookshelf')(knex)
bookshelf.plugin('registry')

const tracker = mockKnex.getTracker()
tracker.install()

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

module.exports = {
  knex,
  bookshelf,
  tracker
}
