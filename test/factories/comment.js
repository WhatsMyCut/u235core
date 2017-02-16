'use strict'
const bookshelf = require('./server-route').bookshelf
const faker = require('faker')
const Promise = require('bluebird')
const UserFactory = require('./user')

const Comment = bookshelf.model('Comment')

module.exports = {
  createWithDependencies: Promise.coroutine(function *(buildAttrs) {
    let user = yield UserFactory.create()
    let attrs = Object.assign({
      comment: faker.lorem.text(),
      reportedBy: user.get('id')
    }, buildAttrs)

    return Promise.props({
      user: user,
      comment: Comment.forge(attrs).save()
    })
  })
}
