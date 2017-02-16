'use strict'
const faker = require('faker')
const bookshelf = require('./server-route').bookshelf
const knex = bookshelf.knex
const Promise = require('bluebird')
const User = bookshelf.model('User')
const Role = bookshelf.model('Role')
const UserRole = bookshelf.model('UserRole')
const Permission = bookshelf.model('Permission')
const RolePermission = bookshelf.model('RolePermission')
const _ = require('lodash')
const uuid = require('node-uuid')

module.exports = {
  create: function(buildAttrs) {
    let attrs = Object.assign({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email()
    }, buildAttrs)

    return User.forge(attrs).save()
  },

  createWithPassword: Promise.coroutine(function *(buildAttrs) {
    buildAttrs = buildAttrs || {}

    let password = buildAttrs.password

    if (!password) {
      password = faker.internet.password()
    }

    let attrs = Object.assign({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email()
    }, _.omit(buildAttrs, ['password']))

    return new User(attrs).createWithCredentialsAndApiKey({username: attrs.email, password: password }).then(u => {
      return u
    })
  }),

  createWithPermissions: Promise.coroutine(function *(opts, perms) {
    let u = yield this.create(opts)
    let r = yield Role.forge({ name: `Role for user: #${u.id}` }).save()
    let ur = yield UserRole.forge({ userId: u.id, roleId: r.id }).save()
    let query =
      knex.select('*')
        .from('permissions')
        .whereIn(knex.raw(`concat(resource::text, '.', action::text)`), perms)
    let permissions = yield query
    let saves = permissions.map(p =>
      RolePermission.forge({ roleId: r.id, permissionId: p.id }).save()
    )

    return Promise.all(saves).then(() => {
      return { user: u, role: r, userRole: ur }
    })
  }),

  createResetCode: Promise.coroutine(function *(buildAttrs) {
    buildAttrs = buildAttrs || {}
    let expiration = buildAttrs.resetExpiration

    if (!buildAttrs.resetExpiration) {
      let now = new Date()
      expiration = new Date(now.getTime() + 600 * 1e3)
    }

    let user = yield new User({ id: buildAttrs.id, email: buildAttrs.email })
      .fetch({ withRelated: 'credential' })
    if (user === null) {
      return
    }

    let resetCode = uuid.v4()

    let credential = yield user.related('credential').save({
      resetCode: resetCode,
      // 10 minutes from now
      resetExpiration: expiration
    })

    return credential
  })
}
