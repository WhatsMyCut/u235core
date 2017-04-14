const Promise = require('bluebird')

exports.up = function(knex, Promise) {
  return knex.schema.createTable('credentials', table => {
      table.increments()
      table.string('username', 40)
      table.string('password_hash', 2048).notNullable()
      table.string('reset_code', 255).unique()
      table.dateTime('reset_expiration')
      table.boolean('active')
      table.timestamps()
  }).then(() => {
    return knex.schema.createTable('users', table => {
      table.increments()
      table.integer('credential_id').references('id').inTable('credentials')
      table.string('first_name', 100)
      table.string('last_name', 100)
      table.string('email', 100)
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('service_credentials', t => {
      t.increments()
      t.text('description').notNullable()
      t.string('key').notNullable().unique()
      t.text('secret').notNullable().unique()
      t.timestamps(false, true)
    })
  }).then(() => {
    return knex.schema.createTable('api_keys', table => {
      table.increments()
      table.integer('user_id').notNullable()
      table.string('label', 100)
      table.string('api_key', 2048).unique().notNullable()
      table.string('api_secret', 2048).unique().notNullable()
      table.boolean('active')
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('roles', table => {
      table.increments()
      table.string('name', 100)
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('user_scopes', table => {
      table.increments()
      table.string('scope_type', 255),
      table.string('scope_id', 100)
      table.integer('user_id').references('id').inTable('users')
      table.integer('role_id').references('id').inTable('roles')
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('user_roles', t => {
      t.increments()
      t.integer('user_id').references('id').inTable('users').notNullable()
      t.integer('role_id').references('id').inTable('roles').notNullable()
      t.timestamps()
    })
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
    let now = new Date()
    let permissions = [
      { name: 'View Basic Records', resource: 'BASIC_OBJECTS', action: 'READ', description: 'Access to view ancillary data important for creating programs', created_at: now, updated_at: now },
      { name: 'Create Comments', resource: 'COMMENTS', action: 'CREATE', description: 'Access to create comments', created_at: now, updated_at: now },
      { name: 'View Comments', resource: 'COMMENTS', action: 'READ', description: 'Access to view comments', created_at: now, updated_at: now },
      { name: 'Update Comments', resource: 'COMMENTS', action: 'UPDATE', description: 'Access to update comments', created_at: now, updated_at: now },
      { name: 'Delete Comments', resource: 'COMMENTS', action: 'DELETE', description: 'Access to delete comments', created_at: now, updated_at: now },
      { name: 'Access Fields', resource: 'FIELDS', action: 'READ', description: 'Read-only access to base fields', created_at: now, updated_at: now },
      { name: 'Access Field Groups', resource: 'FIELD_GROUPS', action: 'READ', description: 'Read-only access to base field groups', created_at: now, updated_at: now },
      { name: 'View Histories', resource: 'HISTORIES', action: 'READ', description: 'Read-only access for logging data', created_at: now, updated_at: now },
      { name: 'Create Roles', resource: 'ROLES', action: 'CREATE', description: 'Access to create roles', created_at: now, updated_at: now },
      { name: 'View Roles', resource: 'ROLES', action: 'READ', description: 'Read-only access to roles', created_at: now, updated_at: now },
      { name: 'Update Roles', resource: 'ROLES', action: 'UPDATE', description: 'Access to add/remove permissions from roles', created_at: now, updated_at: now },
      { name: 'Delete Roles', resource: 'ROLES', action: 'DELETE', description: 'Access to delete roles', created_at: now, updated_at: now },
      { name: 'Create Users', resource: 'USERS', action: 'CREATE', description: 'Access to create new system users', created_at: now, updated_at: now },
      { name: 'View Users', resource: 'USERS', action: 'READ', description: 'Read-only access to system users', created_at: now, updated_at: now },
      { name: 'Update Users', resource: 'USERS', action: 'UPDATE', description: 'Access to update system users', created_at: now, updated_at: now }
    ]
    return knex('permissions').insert(permissions)
  }).then(() => {
    return knex.schema.createTable('role_permissions', t => {
      t.increments()
      t.integer('role_id').references('id').inTable('roles').notNullable()
      t.integer('permission_id').references('id').inTable('permissions').notNullable()
      t.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('api_permissions', table => {
      table.increments()
      table.string('method', 100).unique().notNullable()
      table.string('route', 255).unique().notNullable()
    })
  }).then(() => {
    return knex.schema.createTable('api_permission_roles', table => {
      table.increments()
      table.integer('role_id').references('id').inTable('roles')
      table.integer('api_permission_id').references('id').inTable('api_permissions')
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('ui_permissions', table => {
      table.increments()
      table.string('name', 100)
      table.string('key', 100).unique().notNullable()
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('ui_permission_roles', table => {
      table.increments()
      table.integer('role_id').references('id').inTable('roles')
      table.integer('ui_permission_id').references('id').inTable('ui_permissions')
      table.timestamps()
    })
  }).then(() => {
    return knex.schema.createTable('histories', table => {
      table.jsonb('data').nullable()
      table.string('action').notNullable()
      table.string('from').nullable()
      table.string('to').nullable()
      table.integer('comment_id').nullable()
    })
  }).then(() => {
    return knex.schema.createTable('comments', table => {
      table.increments(),
      table.text('comment').notNullable(),
      table.integer('reported_by').references('id').inTable('users').notNullable(),
      table.timestamps()
    })
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
    knex.schema.dropTable('user_roles'),
    knex.schema.dropTable('role_permissions'),
    knex.schema.dropTable('permissions'),
    knex.schema.dropTable('api_permission_roles'),
    knex.schema.dropTable('api_permissions'),
    knex.schema.dropTable('ui_permission_roles'),
    knex.schema.dropTable('ui_permissions'),
    knex.schema.dropTable('histories'),
    knex.schema.dropTable('comments')

  )
}
