
exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_roles', t => {
    t.increments()
    t.integer('user_id').references('id').inTable('users').notNullable()
    t.integer('role_id').references('id').inTable('roles').notNullable()
    t.timestamps()
  }).then(() => {
    return knex.schema.createTable('permissions', t => {
      t.increments()
      t.string('name').notNullable()
      t.string('resource').notNullable()
      t.string('action').notNullable()
      t.text('description').notNullable()
      t.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('role_permissions', t => {
      t.increments()
      t.integer('role_id').references('id').inTable('roles').notNullable()
      t.integer('permission_id').references('id').inTable('permissions').notNullable()
      t.timestamps()
    })
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('role_permissions').then(() => {
    return knex.schema.dropTable('permissions')
  }).then(() => {
    return knex.schema.dropTable('user_roles')
  })
}
