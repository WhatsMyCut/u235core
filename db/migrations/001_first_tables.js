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
      table.string('action').notNullable()
      table.text('description').notNullable()
      table.string('method', 100).notNullable()
      table.string('route', 255).notNullable()
      table.string('name').notNullable()
      table.string('resource').notNullable()
      table.timestamps()
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
    }),

    knex.schema.createTable('comments', table => {
      table.increments(),
      table.text('comment').notNullable(),
      table.integer('reported_by').references('id').inTable('users').notNullable(),
      table.timestamps()
    })
  ).then(() => {
    let now = new Date()
    let permissions = [
      { name: 'View Basic Records', resource: 'BASIC_OBJECTS', route: '*', method: 'GET', action: 'READ', description: 'Access to view ancillary data important for creating programs', created_at: now, updated_at: now },
      { name: 'Create Comments', resource: 'COMMENTS', route: '/comments/create', method: 'POST', action: 'CREATE', description: 'Access to create comments', created_at: now, updated_at: now },
      { name: 'View Comments', resource: 'COMMENTS', route: '/comments', method: 'GET', action: 'READ', description: 'Access to view comments', created_at: now, updated_at: now },
      { name: 'Update Comments', resource: 'COMMENTS', route: '/comments/${id}', method: 'PATCH', action: 'UPDATE', description: 'Access to update comments', created_at: now, updated_at: now },
      { name: 'Delete Comments', resource: 'COMMENTS', route: '/comments/${id}', method: 'DELETE', action: 'DELETE', description: 'Access to delete comments', created_at: now, updated_at: now },
      { name: 'Access Fields', resource: 'FIELDS', route: '/fields', method: 'GET', action: 'READ', description: 'Read-only access to base fields', created_at: now, updated_at: now },
      { name: 'Access Field Groups', resource: 'FIELD_GROUPS', route: '/field-groups', method: 'GET', action: 'READ', description: 'Read-only access to base field groups', created_at: now, updated_at: now },
      { name: 'View Histories', resource: 'HISTORIES', route: '/histories', method: 'GET', action: 'READ', description: 'Read-only access for logging data', created_at: now, updated_at: now },
      { name: 'Create Roles', resource: 'ROLES', route: '/roles/create', method: 'POST', action: 'CREATE', description: 'Access to create roles', created_at: now, updated_at: now },
      { name: 'View Roles', resource: 'ROLES', route: '/roles', method: 'GET', action: 'READ', description: 'Read-only access to roles', created_at: now, updated_at: now },
      { name: 'Update Roles', resource: 'ROLES', route: '/roles/${id}', method: 'PATCH', action: 'UPDATE', description: 'Access to add/remove permissions from roles', created_at: now, updated_at: now },
      { name: 'Delete Roles', resource: 'ROLES', route: '/roles/${id}', method: 'DELETE', action: 'DELETE', description: 'Access to delete roles', created_at: now, updated_at: now },
      { name: 'Create Users', resource: 'USERS', route: '/users/create', method: 'POST', action: 'CREATE', description: 'Access to create new system users', created_at: now, updated_at: now },
      { name: 'View Users', resource: 'USERS', route: '/users', method: 'GET', action: 'READ', description: 'Read-only access to system users', created_at: now, updated_at: now },
      { name: 'Update Users', resource: 'USERS', route: '/users/${id}', method: 'PATCH', action: 'UPDATE', description: 'Access to update system users', created_at: now, updated_at: now }
    ]
    return knex('api_permissions').insert(permissions)
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
    knex.schema.dropTable('comments')
  ).then(() => {
      return knex('api_permissions').whereIn('resource', [
      'BASIC_OBJECTS',
      'COMMENTS',
      'FIELDS',
      'FIELD_GROUPS',
      'HISTORIES',
      'ROLES',
      'USERS'
    ]).del()
  })
}
