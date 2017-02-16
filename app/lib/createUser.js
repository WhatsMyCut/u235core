const Promise = require('bluebird')
let hashPassword = require('./hashPassword')
let generateApiKeyValue = require('./generateApiKeyValue')

const createUser = Promise.coroutine(function *(knex, username) {
  var now = new Date()

  // create user credentials
  var password = 'admin'
  var passwordHash = yield hashPassword(password)
  var credentialIds = yield knex('credentials').insert({
    username: username,
    password_hash: passwordHash,
    created_at: now,
    updated_at: now,
    active: true,
  }).returning('id')
  var credentialId = credentialIds[0]

  // create user
  var userIds = yield knex('users').insert({
    email: username,
    credential_id: credentialId,
    created_at: now,
    updated_at: now,
  }).returning('id')
  var userId = userIds[0]

  // create api key for user
  yield knex('api_keys').insert({
    user_id: userId,
    api_key: yield generateApiKeyValue(),
    api_secret: yield generateApiKeyValue(),
    active: true,
    created_at: now,
    updated_at: now,
  })

  // Give the user the Sysadmin role
  var roles = yield knex('roles').where({ name: 'Sysadmin' })
  var roleId = roles[0].id
  yield knex('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    created_at: now,
    updated_at: now,
  })
})

module.exports = createUser
