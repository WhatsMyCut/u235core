const lab = exports.lab = require('lab').script()
const Code = require('code')
const Hapi = require('hapi')
const Boom = require('boom')

const RespEnv = require('../../app/plugins/response-envelope')

const expect = Code.expect
const describe = lab.describe
const it = lab.it

function provisionServer() {
  const plugin = { register: RespEnv, options: {} }
  const server = new Hapi.Server()
  server.connection({})
  server.register(plugin)
  return server
}

describe('response-envelope', () => {

  it('wraps object result in envelope', done => {

    const server = provisionServer()
    const handler = (request, reply) => reply({ name: 'U235' })
    server.route({ method: 'GET', path: '/', handler })

    server.inject('/', res => {
      const payload = JSON.parse(res.payload)
      expect(payload.error).to.be.null()
      expect(payload.result.name).to.equal('U235')
      expect(res.headers['content-type']).to.contain('application/json')
      done()
    })
  })

  it('wraps string result in envelope', done => {

    const server = provisionServer()
    const handler = (request, reply) => reply('U235')
    server.route({ method: 'GET', path: '/', handler })

    server.inject('/', res => {
      expect(res.payload).to.equal('U235')
      expect(res.headers['content-type']).to.contain('text/html')
      done()
    })
  })

  it('wraps error result in envelope', done => {

    const server = provisionServer()
    const handler = (request, reply) => reply(Boom.notFound())
    server.route({ method: 'GET', path: '/', handler })

    server.inject('/', res => {
      const payload = JSON.parse(res.payload)
      expect(payload.result).to.be.null()
      expect(payload.error.statusCode).to.equal(404)
      expect(res.headers['content-type']).to.contain('application/json')
      done()
    })
  })

})
