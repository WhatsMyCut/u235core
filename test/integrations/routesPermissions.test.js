'use strict'
const Promise = require('bluebird')
const lab = exports.lab = require('lab').script()
const Code = require('code')
const Permissions = require('../../app/lib/constants/Permissions')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it
const td = require('testdouble')

const glob = require('glob')
const _ = require('lodash')
const path = require('path')

describe('route permissions', () => {
  function getRoutes(pattern) {
    let files = glob.sync(pattern)
    return files.reduce((memo, file) => {
      let actions = _.values(require(file)).map(a => Object.assign({}, a, { file }))
      return [].concat(memo, actions)
    }, [])
  }
  let routes = getRoutes(path.resolve(__dirname, '../../app/routes') + '/**.js')

  it('has no undefined permissions', { timeout: 5000 }, (done) => {
    let messages = []

    routes.forEach(r => {
      let access = _.get(r, 'config.auth.access')
      if (!access || (access && !('scope' in access))) { return }
      let scope = access.scope
      let permissions = Array.isArray(scope) ? scope : [scope]
      let errorPositions = permissions.map(p => p == null)
      let hasRouteErrors = errorPositions.some(e => e === true)
      if (hasRouteErrors) {
        let posString = errorPositions.map(err => err ? 'Invalid' : 'Valid').join(', ')
        messages.push(`The route with path ${r.path} in ${r.file} has undefined scope parameters at these positions [${posString}]`)
      }
    })

    if (messages.length > 0) {
      Code.fail(messages.join("\n"))
    }
    done()
  })

  it('has only valid permissions', done => {
    let messages = []
    let validPermissions = _.invert(Permissions)

    routes.forEach(r => {
      let access = _.get(r, 'config.auth.access')
      if (!access || (access && !('scope' in access))) { return }
      let scope = access.scope
      let routePermissions = Array.isArray(scope) ? scope : [scope]

      let errorPositions = routePermissions.map(p => (p in validPermissions) === false)
      let hasRouteErrors = errorPositions.some(e => e === true)
      if (hasRouteErrors) {
        let posString = errorPositions.map(err => err ? 'Invalid' : 'Valid').join(', ')
        messages.push(`The route with path ${r.path} in ${r.file} has invalid scope parameters at these positions [${posString}]`)
      }
    })

    if (messages.length > 0) {
      Code.fail(messages.join("\n"))
    }
    done()
  })
})
