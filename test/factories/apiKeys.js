'use strict'
const faker = require('faker')
const bookshelf = require('./server-route').bookshelf
const ApiKey = bookshelf.model('ApiKey')
const Promise = require('bluebird')
const UserFactory = require('./user')
const _ = require('lodash')
const generateApiKeyValue = require('../../app/lib/generateApiKeyValue')

module.exports = {
  createWithDependencies: Promise.coroutine(function *(buildAttrs) {
    buildAttrs = buildAttrs || {}

    let user

    if (!buildAttrs.user) {
      user = yield UserFactory.create()
    } else {
      user = buildAttrs.user
    }

    let attrs = Object.assign({
      userId: user.get('id'),
      label: faker.lorem.word(),
      apiKey: yield generateApiKeyValue(),
      apiSecret: yield generateApiKeyValue(),
      active: true
    }, _.omit(buildAttrs, ['user']))

    return Promise.props({
      user: user,
      apiKey: ApiKey.forge(attrs).save()
    })
  })
}
