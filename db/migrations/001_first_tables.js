const Promise = require('bluebird')

exports.up = function(knex, Promise) {
  return Promise.join(


    knex.schema.createTable('users', table => {
      table.increments()
      table.integer('credential_id').references('id').inTable('credentials')
      table.string('first_name', 100)
      table.string('last_name', 100)
      table.string('email', 100)
      table.timestamps()
    }),

    knex.schema.createTable('credentials', table => {
      table.increments()
      table.string('username', 40)
      table.string('password_hash', 2048).notNullable()
      table.string('reset_code', 255).unique()
      table.dateTime('reset_expiration')
      table.boolean('active')
      table.timestamps()
    }),

    knex.schema.createTable('service_credentials', t => {
      t.increments()
      t.text('description').notNullable()
      t.string('key').notNullable().unique()
      t.text('secret').notNullable().unique()
      t.timestamps(false, true)
    }),

    knex.schema.createTable('api_keys', table => {
      table.increments()
      table.integer('user_id').notNullable()
      table.string('label', 100)
      table.string('api_key', 2048).unique().notNullable()
      table.string('api_secret', 2048).unique().notNullable()
      table.boolean('active')
      table.timestamps()
    }),

    knex.schema.createTable('roles', table => {
      table.increments()
      table.string('name', 100)
      table.timestamps()
    }),

    knex.schema.createTable('user_scopes', table => {
      table.increments()
      table.string('scope_type', 255),
      table.string('scope_id', 100)
      table.integer('user_id').references('id').inTable('users')
      table.integer('role_id').references('id').inTable('roles')
      table.timestamps()
    }),

    knex.schema.createTable('api_permissions', table => {
      table.increments()
      table.string('method', 100).unique().notNullable()
      table.string('route', 255).unique().notNullable()
    }),

    knex.schema.createTable('api_permission_roles', table => {
      table.increments()
      table.integer('role_id').references('id').inTable('roles')
      table.integer('api_permission_id').references('id').inTable('api_permissions')
      table.timestamps()
    }),

    knex.schema.createTable('ui_permissions', table => {
      table.increments()
      table.string('name', 100)
      table.string('key', 100).unique().notNullable()
      table.timestamps()
    }),

    knex.schema.createTable('ui_permission_roles', table => {
      table.increments()
      table.integer('role_id').references('id').inTable('roles')
      table.integer('ui_permission_id').references('id').inTable('ui_permissions')
      table.timestamps()
    })
  )

    knex.schema.table('histories', table => {
      table.jsonb('data').nullable()
      table.string('action').notNullable()
      table.string('from').nullable()
      table.string('to').nullable()
      table.integer('comment_id').nullable()
    }),

    knex.schema.createTable('comments', table => {
      table.increments(),
      table.text('comment').notNullable(),
      table.integer('reported_by').references('id').inTable('users').notNullable(),
      table.timestamps()
    })

}

exports.down = function(knex, Promise) {
  return Promise.join(

    knex.schema.dropTable('users'),
    knex.schema.dropTable('credentials'),
    knex.schema.dropTable('service_credentials'),
    knex.schema.dropTable('api_keys'),
    knex.schema.dropTable('roles'),
    knex.schema.dropTable('user_scopes'),
    knex.schema.dropTable('api_permission_roles'),
    knex.schema.dropTable('api_permissions'),
    knex.schema.dropTable('ui_permission_roles'),
    knex.schema.dropTable('ui_permissions'),
    knex.schema.dropTable('histories'),
    knex.schema.dropTable('comments')

  )
}
