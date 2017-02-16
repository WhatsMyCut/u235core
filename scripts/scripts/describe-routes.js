const fs = require('fs')
const glob = require('glob')

const _ = require('lodash')
const path = require('path')
const cwd = process.cwd()
const Table = require('cli-table')

function getRoutes(pattern) {
  let files = glob.sync(pattern)
  return files.reduce((memo, file) => {
    file = path.join(cwd, file)
    let actions = _.values(require(file)).map(a => Object.assign({}, a, { file }))

    return [].concat(memo, actions)
  }, [])
}

const routes = _.sortBy(getRoutes('./app/routes/**.js'), 'path')

const t = new Table({
  head: ['Method', 'Path', 'Permissions'],
})

routes.forEach(r => {
  let scope = _.get(r, 'config.auth.access.scope')
  let permissions = Array.isArray(scope) ? scope : [scope]
  let permissionsStr = _.compact(permissions).length > 0 ? permissions.join(', ') : 'UNAUTHENTICATED'
  t.push([r.method, `${r.path} (${path.basename(r.file)})`, permissionsStr])
})
console.log(t.toString())
console.log('Route Count:', routes.length)
