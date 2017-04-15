let Promise = require('bluebird')
let hashPassword = require('../../app/lib/hashPassword')
let uuid = require('node-uuid')

exports.seed = Promise.coroutine(function *(knex, Promise) {
  let now = new Date()

  // create user credentials
  let password = 'admin'
  let passwordHash = yield hashPassword(password)
  let credentialIds = yield knex('credentials').insert({
    username: 'admin',
    password_hash: passwordHash,
    created_at: now,
    updated_at: now,
    active: true,
  }).returning('id')
  let credentialId = credentialIds[0]

  // create user
  let userIds = yield knex('users').insert({
    email: 'admin',
    credential_id: credentialId,
    created_at: now,
    updated_at: now,
  }).returning('id')
  let userId = userIds[0]

  // create api key for user
  yield knex('api_keys').insert({
    user_id: userId,
    api_key: uuid.v4(),
    api_secret: uuid.v4(),
    active: true,
    created_at: now,
    updated_at: now,
  })

  // Give the user the Sysadmin role
  let res1 = yield knex('roles').returning('id').insert({
    name: 'Sysadmin',
    created_at: now,
    updated_at: now,
  })
  let roleId = res1[0]

  let res2 = yield knex('api_permissions').returning('id').insert({
    name: 'System',
    resource: 'ALL',
    action: '*',
    method: '*',
    route: '/',
    description: 'This permission allows a user to perform any action and access any data',
    created_at: now,
    updated_at: now,
  })
  let permissionId = res2[0]

  return Promise.resolve(true)
})
