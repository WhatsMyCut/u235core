'use strict'
const bookshelf = require('./server-route').bookshelf
const faker = require('faker')
const Promise = require('bluebird')
const UserFactory = require('./user')

const History = bookshelf.model('History')

module.exports = {
  createWithDependencies: Promise.coroutine(function *(buildAttrs) {
    let user = yield UserFactory.create()
    let attrs = Object.assign({
      entityId: faker.random.number(),
      entity: faker.random.word(),
      action: faker.random.word(),
      userId: user.get('id')
    }, buildAttrs)

    return Promise.props({
      user: user,
      history: History.forge(attrs).save()
    })
  })
}
