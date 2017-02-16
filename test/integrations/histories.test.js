'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const mock = require('../factories/server-route')

const HistoriesRoute = require('../../app/routes/histories')
const provisionServer = mock.configure(HistoriesRoute)
const HistoryFactory = require('../factories/history')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('histories route', () => {

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

        let records = yield HistoryFactory.createWithDependencies()
        let history = records.history

        server.inject({
          method: 'GET',
          url: `/histories/${history.get('id')}`,
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(history.get('id'))
          expect(payload.userId).to.equal(history.get('userId'))
          expect(payload.entityId).to.equal(history.get('entityId'))
          expect(payload.entity).to.equal(history.get('entity'))
          done()
        })
      })()
    })

    it('attempts to fetch a non existant record and returns 404', done => {

      server.inject({
        method: 'GET',
        url: '/histories/321',
        headers: createHeaders()
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(404)
        expect(payload.statusCode).to.equal(404)
        done()
      })
    })
  })

  describe('index', () => {

    it('fetches records from the db and responds with them', done => {

      Promise.coroutine(function *(){

        let records = yield HistoryFactory.createWithDependencies()
        let history = records.history
        yield HistoryFactory.createWithDependencies()
        yield HistoryFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/histories',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          expect(payload[0].id).to.equal(history.get('id'))
          expect(payload[0].userId).to.equal(history.get('userId'))
          expect(payload[0].entityId).to.equal(history.get('entityId'))
          expect(payload[0].entity).to.equal(history.get('entity'))
          done()
        })
      })()
    })

    it('fetches the specified page of records', done => {

      Promise.coroutine(function *(){

        yield HistoryFactory.createWithDependencies()
        yield HistoryFactory.createWithDependencies()
        yield HistoryFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/histories?page=0&per_page=5',
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

        yield HistoryFactory.createWithDependencies()
        yield HistoryFactory.createWithDependencies()
        yield HistoryFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/histories?order=entity&dir=desc',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          done()
        })
      })()
    })
  })
})
