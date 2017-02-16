const lab = exports.lab = require('lab').script()
const Code = require('code')
const Hapi = require('hapi')

const OkComputer = require('../../app/plugins/okcomputer')

const expect = Code.expect
const describe = lab.describe
const it = lab.it

function provisionServer() {
  const plugin = { register: OkComputer, options: {} }
  const server = new Hapi.Server()
  server.connection({})
  server.register(plugin)
  return server
}

describe('okcomputer', () => {

  it('registers a route', done => {

    const server = provisionServer()

    expect(server.connections[0].table()[0].path).to.equal('/okcomputer')
    done()
  })

  it('responds with 200', done => {

    const server = provisionServer()

    server.inject('/okcomputer', res => {

      expect(res.statusCode).to.equal(200)
      expect(res.payload).to.contain('OKComputer Site Check Passed')
      done()
    })
  })
})
