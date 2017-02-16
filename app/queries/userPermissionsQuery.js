const camelCaseKeys = require('../lib/camelCaseKeys')

// $lab:coverage:off$
// covered by integration tests
class UserPermissionsQuery {
  constructor(knex, userId) {
    this.knex = knex
    this.userId = userId
    this.build()
  }

  fetch() {
    return this.query.then(rows => {
      return rows.map(camelCaseKeys)
    })
  }

  toString() {
    return this.query.toString()
  }

  toSQL() {
    return this.query.toSQL()
  }

  build() {
    this.query =
      this.knex.select('permissions.*')
        .from('permissions')
        .innerJoin('role_permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        .innerJoin('roles', 'role_permissions.role_id', '=', 'roles.id')
        .innerJoin('user_roles', 'role_permissions.role_id', '=', 'roles.id')
        .innerJoin('users', 'user_roles.user_id', '=', 'users.id')
        .where('users.id', '=', this.userId)
  }
}
// $lab:coverage:on$

module.exports = UserPermissionsQuery
