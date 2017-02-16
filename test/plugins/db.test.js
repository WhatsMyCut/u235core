const lab = exports.lab = require('lab').script()
const Code = require('code')
const Hapi = require('hapi')

const DB = require('../../app/plugins/db')

const expect = Code.expect
const describe = lab.describe
const it = lab.it

function provisionServer() {
  const plugin = { register: DB, options: {} }
  const server = new Hapi.Server()
  server.connection({})
  server.plugins.bookshelf = {
    model() {
      return { Model: 42, Collection: 43 }
    }
  }
  server.register(plugin)
  return server
}

describe('db', () => {

  it('decorates server with db method', done => {

    const server = provisionServer()

    expect(server.db).to.be.a.function()
    expect(server.db()).to.be.a.object()
    done()
  })

  it('decorates request with db property', done => {

    const server = provisionServer()
    const handler = (request, reply) => reply(request.db.model('foo'))

    server.route({ method: 'GET', path: '/', handler })

    server.inject('/', res => {

      expect(res.payload).to.contain('42')
      done()
    })
  })
})
