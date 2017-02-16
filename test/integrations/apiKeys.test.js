'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const mock = require('../factories/server-route')

const ApiKeysRoute = require('../../app/routes/apiKeys')
const provisionServer = mock.configure(ApiKeysRoute)
const ApiKeysFactory = require('../factories/apiKeys')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('apikeys route', () => {

  beforeEach(done => {
    server = provisionServer()
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  afterEach(done => {
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  describe('show', () => {

    it('fetches a record from the db and responds with it', done => {

      Promise.coroutine(function *(){

        let records = yield ApiKeysFactory.createWithDependencies()
        let apiKey = records.apiKey

        server.inject({
          method: 'GET',
          url: `/api-keys/${apiKey.get('id')}`,
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(apiKey.get('id'))
          expect(payload.userId).to.equal(apiKey.get('userId'))
          expect(payload.label).to.equal(apiKey.get('label'))
          expect(payload.apiKey).to.equal(apiKey.get('apiKey'))
          expect(payload.apiSecret).to.equal(apiKey.get('apiSecret'))
          expect(payload.active).to.equal(apiKey.get('active'))
          done()
        })
      })()

    })
  })

  describe('index', () => {

    it('fetches records from the db and responds with them', done => {

      Promise.coroutine(function *(){

        let records1 = yield ApiKeysFactory.createWithDependencies()
        let user = records1.user
        let apiKey = records1.apiKey
        yield ApiKeysFactory.createWithDependencies({user: user})
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'GET',
          url: '/api-keys',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          expect(payload[0].id).to.equal(apiKey.get('id'))
          expect(payload[0].userId).to.equal(apiKey.get('userId'))
          expect(payload[0].label).to.equal(apiKey.get('label'))
          expect(payload[0].apiKey).to.equal(apiKey.get('apiKey'))
          expect(payload[0].apiSecret).to.equal(apiKey.get('apiSecret'))
          expect(payload[0].active).to.equal(apiKey.get('active'))
          done()
        })
      })()
    })

    it('fetches the specified page of records', done => {

      Promise.coroutine(function *(){

        let records1 = yield ApiKeysFactory.createWithDependencies()
        let user = records1.user
        yield ApiKeysFactory.createWithDependencies({user: user})
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'GET',
          url: '/api-keys?page=0&per_page=5',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          done()
        })
      })()
    })

    it('fetches records in desc order', done => {

      Promise.coroutine(function *(){

        let records1 = yield ApiKeysFactory.createWithDependencies()
        let user = records1.user
        yield ApiKeysFactory.createWithDependencies({user: user})
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'GET',
          url: '/api-keys?order=label&dir=desc',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          done()
        })
      })()
    })
  })

  describe('create', () => {

    it('inserts a record and responds with it', done => {

      server.inject({
        method: 'POST',
        url: '/api-keys',
        headers: createHeaders(),
        payload: {
          userId: 1,
          label: 'foo',
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.userId).to.equal(1)
        expect(payload.label).to.equal('foo')
        expect(payload.apiKey).to.equal('foo')
        expect(payload.apiSecret).to.equal('foo')
        expect(payload.active).to.equal(true)
        done()
      })
    })

    it('inserts a record with missing user id and fails with a 400 error', done => {

      server.inject({
        method: 'POST',
        url: '/api-keys',
        headers: createHeaders(),
        payload: {
          label: 'foo',
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })

    it('inserts a record with missing label and fails with a 400 error', done => {

      server.inject({
        method: 'POST',
        url: '/api-keys',
        headers: createHeaders(),
        payload: {
          label: 'foo',
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })
  })

  describe('update', () => {

    it('updates a record and responds with it', done => {

      ApiKeysFactory.createWithDependencies().then(records => {
        let apiKey = records.apiKey

        server.inject({
          method: 'PUT',
          url: `/api-keys/${apiKey.get('id')}`,
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
            id: apiKey.get('id'),
            userId: 1,
            label: 'foo',
            apiKey: 'foo',
            apiSecret: 'foo',
            active: true,
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(apiKey.get('id'))
          expect(payload.userId).to.equal(1)
          expect(payload.label).to.equal('foo')
          expect(payload.apiKey).to.equal('foo')
          expect(payload.apiSecret).to.equal('foo')
          expect(payload.active).to.equal(true)
          done()
        })
      })
    })

    it('updates a record with missing user id and fails with a 400 error', done => {

      server.inject({
        method: 'PUT',
        url: '/api-keys/123',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
        payload: {
          label: 'foo',
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })

    it('updates a record with missing label and fails with a 400 error', done => {

      server.inject({
        method: 'PUT',
        url: '/api-keys/123',
        headers: createHeaders(),
        payload: {
          userId: 1,
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })

    it('Updates a nonexistent record and responds with a 404 error', done => {

      server.inject({
        method: 'PUT',
        url: '/api-keys/321',
        headers: createHeaders(),
        payload: {
          userId: 1,
          label: 'foo',
          apiKey: 'foo',
          apiSecret: 'foo',
          active: true,
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(404)
        expect(payload.statusCode).to.equal(404)
        done()
      })
    })
  })
})
