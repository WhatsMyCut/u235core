'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const crypto = require('crypto')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')

const mock = require('../factories/server-route')
const ServiceCredentialsRoute = require('../../app/routes/serviceCredentials')
const provisionServer = mock.configure(ServiceCredentialsRoute)

const expect = Code.expect
const describe = lab.describe
const before = lab.before
const after = lab.after
const it = lab.it

let server
let mockEncryptionKey = 'souper-secret'
let serviceSecretEncryptionKey = process.env.SERVICE_SECRET_ENCRYPTION_KEY
let createHeaders = () => ({
  authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')
})

describe('service credentials route', () => {
  before(done => {
    process.env.SERVICE_SECRET_ENCRYPTION_KEY = mockEncryptionKey
    server = provisionServer()
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  after(done => {
    process.env.SERVICE_SECRET_ENCRYPTION_KEY = serviceSecretEncryptionKey
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  let serviceKey

  describe('creating credentials', () => {
    it('responds with unencrypted credentials', done => {
      server.inject({
        method: 'POST',
        url: '/service-credentials',
        headers: createHeaders(),
        payload: {
          description: 'New credentials for a new service'
        }
      }, res => {
        expect(res.statusCode).to.equal(200)
        let p1 = JSON.parse(res.payload)

        let ServiceCredential = mock.bookshelf.model('ServiceCredential')
        ServiceCredential.forge({ id: p1.id }).fetch().then(sc => {
          let decipher = crypto.createDecipher('aes-256-ctr', mockEncryptionKey)
          let decrypted = decipher.update(sc.get('secret'), 'hex', 'utf8') + decipher.final('utf8')
          serviceKey = sc.get('key')
          expect(p1.key).to.equal(sc.get('key'))
          expect(p1.secret).not.to.equal(sc.get('secret'))
          expect(decrypted).to.equal(p1.secret)
          done()
        }).catch(done)
      })
    })
  })

  describe('getting credentials', () => {
    it('responds with credentials', done => {
      server.inject({
        method: 'GET',
        url: '/service-credentials',
        headers: createHeaders()
      }, res => {
        expect(res.statusCode).to.equal(200)
        let credentials = JSON.parse(res.payload)
        expect(credentials).to.be.an.array()
        expect(credentials[0]).to.be.an.object()
        expect(credentials[0]).to.only.include(['id', 'key', 'description', 'createdAt', 'updatedAt'])
        done()
      })
    })
  })

  describe('getting credentials by key', () => {
    it('responds with credentials', done => {
      server.inject({
        method: 'GET',
        url: '/service-credentials?key=' + serviceKey,
        headers: createHeaders()
      }, res => {
        expect(res.statusCode).to.equal(200)
        let credentials = JSON.parse(res.payload)
        expect(credentials).to.be.an.array()
        expect(credentials[0]).to.be.an.object()
        expect(credentials[0]).to.only.include(['id', 'key', 'description', 'createdAt', 'updatedAt'])
        done()
      })
    })
  })

  describe('getting credentials by incorrect key', () => {
    it('responds with empty array', done => {
      server.inject({
        method: 'GET',
        url: '/service-credentials?key=wrongKey',
        headers: createHeaders()
      }, res => {
        expect(res.statusCode).to.equal(200)
        let credentials = JSON.parse(res.payload)
        expect(credentials).to.be.an.array()
        expect(credentials).to.be.empty()
        done()
      })
    })
  })
})
