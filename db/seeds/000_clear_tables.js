exports.seed = function(knex, Promise) {
  return Promise.join(
    knex('users').del(),
    knex('credentials').del(),
    knex('service_credentials').del(),
    knex('api_keys').del(),
    knex('roles').del(),
    knex('user_scopes').del(),
    knex('api_permission_roles').del(),
    knex('api_permissions').del(),
    knex('ui_permission_roles').del(),
    knex('ui_permissions').del(),
    knex('histories').del(),
    knex('comments').del()
  )
}
