
exports.up = function(knex, Promise) {
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
}

exports.down = function(knex, Promise) {
  return knex('permissions').whereIn('resource', [
    'BASIC_OBJECTS',
    'COMMENTS',
    'FIELDS',
    'FIELD_GROUPS',
    'HISTORIES',
    'ROLES',
    'USERS'
  ]).del()
}
