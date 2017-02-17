let Promise = require('bluebird')
let createUser = require('../../app/lib/createUser')

let deleteUser = Promise.coroutine(function *(knex, username) {
  let credentials = yield knex('credentials').where({username: username})
  let users = yield knex('users').where({credential_id: credentials[0].id})
  yield knex('user_roles').where({user_id: users[0].id}).del()
  yield knex('api_keys').where({user_id: users[0].id}).del()
  yield knex('users').where({id: users[0].id}).del()
  yield knex('credentials').where({id: credentials[0].id}).del()
})

exports.up = Promise.coroutine(function *(knex, Promise) {
  yield createUser(knex, 'mtaylor769@gmail.com'),
  yield createUser(knex, 'demo@whatsmycut.com')
})

exports.down = Promise.coroutine(function *(knex, Promise) {
  yield deleteUser(knex, 'mtaylor769@gmail.com'),
  yield deleteUser(knex, 'demo@whatsmycut.com')
})

