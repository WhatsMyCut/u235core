'use strict'
const faker = require('faker')

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const mock = require('../factories/server-route')

const AuthTokenRoute = require('../../app/routes/authToken')
const provisionServer = mock.configure(AuthTokenRoute)
const UserFactory = require('../factories/user')
const ApiKeysFactory = require('../factories/apiKeys')
const CredentialFactory = require('../factories/credential')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('authtokens route', () => {

  beforeEach(done => {
    server = provisionServer()
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  afterEach(done => {
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  describe('create', () => {

    it('inserts a record and responds with it', done => {

      Promise.coroutine(function *(){
        let records = yield CredentialFactory.create()
        let credential = records.credential
        let password = records.password
        let user = yield UserFactory.create({ credentialId: credential.get('id'), email: credential.get('username') })
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'POST',
          url: '/auth-token',
          headers: createHeaders(),
          payload: { email: user.get('email'), password: password }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.token).to.exist()
          // Note: asserting the same token is hard due to the timestamp being included in the token
          done()
        })
      })()
    })

    it('returns an error when authentication is invalid', done => {

      Promise.coroutine(function *(){
        let records = yield CredentialFactory.create()
        let credential = records.credential
        let user = yield UserFactory.create({ credentialId: credential.get('id'), email: credential.get('username') })
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'POST',
          url: '/auth-token',
          headers: createHeaders(),
          payload: { email: user.get('email'), password: faker.internet.password() }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.statusCode).to.equal(400)
          expect(payload.message).to.equal('Invalid password')
          done()
        })
      })()
    })

    it('returns an error when the credential doesnt exist', done => {

      Promise.coroutine(function *(){
        let user = yield UserFactory.create()
        yield ApiKeysFactory.createWithDependencies({user: user})

        server.inject({
          method: 'POST',
          url: '/auth-token',
          headers: createHeaders(),
          payload: { email: user.get('email'), password: faker.internet.password() }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.statusCode).to.equal(400)
          expect(payload.message).to.equal('Invalid credentials')
          done()
        })
      })()
    })

    it('returns and error when the user doesnt exist', done => {

      Promise.coroutine(function *(){
        let records = yield CredentialFactory.create()
        let password = records.password
        let credential = records.credential

        server.inject({
          method: 'POST',
          url: '/auth-token',
          headers: createHeaders(),
          payload: { email: credential.get('username'), password: password }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.statusCode).to.equal(400)
          expect(payload.message).to.equal('Invalid user')
          done()
        })
      })()
    })

    it('returns an error if the users API key doesnt exist', done => {

      Promise.coroutine(function *(){
        let records = yield CredentialFactory.create()
        let credential = records.credential
        let password = records.password
        let user = yield UserFactory.create({ credentialId: credential.get('id'), email: credential.get('username') })

        server.inject({
          method: 'POST',
          url: '/auth-token',
          headers: createHeaders(),
          payload: { email: user.get('email'), password: password }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.statusCode).to.equal(400)
          expect(payload.message).to.equal('ApiKey doesnt exist for user')
          done()
        })
      })()
    })
  })
})
