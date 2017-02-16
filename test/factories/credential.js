'use strict'
const faker = require('faker')
const bookshelf = require('./server-route').bookshelf
const Credential = bookshelf.model('Credential')
const Promise = require('bluebird')
const hashPassword = require('../../app/lib/hashPassword')
const _ = require('lodash')

module.exports = {
  create: Promise.coroutine(function *(buildAttrs) {
    buildAttrs = buildAttrs || {}
    let password

    if (!buildAttrs.password) {
      password = faker.internet.password()
    } else {
      password = buildAttrs.password
    }

    let hashedPassword = yield hashPassword(password)
    let attrs = Object.assign({
      username: faker.internet.userName(),
      password_hash: hashedPassword,
      active: true
    }, _.omit(buildAttrs, ['password']))

    return Promise.props({
      credential: Credential.forge(attrs).save(),
      password: password
    })
  })
}
