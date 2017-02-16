
exports.up = function(knex, Promise) {
  let now = new Date()
  return Promise.coroutine(function *(){
    let res1 = yield knex('roles').returning('id').insert({
      name: 'Sysadmin',
      created_at: now,
      updated_at: now,
    })
    let roleId = res1[0]

    let res2 = yield knex('permissions').returning('id').insert({
      name: 'System',
      resource: 'ALL',
      action: '*',
      description: 'This permission allows a user to perform any action and access any data',
      created_at: now,
      updated_at: now,
    })
    let permissionId = res2[0]

    yield knex('role_permissions').insert({
      role_id: roleId,
      permission_id: permissionId,
      created_at: now,
      updated_at: now,
    })
  })()
}

exports.down = function(knex, Promise) {
  return Promise.coroutine(function *(){
    let roles = yield knex('roles').where({ name: 'Sysadmin' })
    let roleId = roles[0].id

    yield knex('role_permissions').where({ role_id: roleId }).del()
    yield knex('roles').where({ name: 'Sysadmin' }).del()
    yield knex('permissions').where({ resource: 'ALL' }).del()
  })()
}
