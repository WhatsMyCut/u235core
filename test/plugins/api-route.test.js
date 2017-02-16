'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const Hapi = require('hapi')
const Boom = require('boom')
const mock = require('../fixtures/server-route')

const tracker = mock.tracker
const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

const provisionServer = mock.configure({
  show: { method: 'GET', path: '/show/{id}', handler: { apiShow: { modelName: 'Client' } } },
  index: { method: 'GET', path: '/index', handler: { apiIndex: { collectionName: 'Clients' } } },
  index2: { method: 'GET', path: '/index2', handler: { apiIndex: { collectionName: 'Clients', queryFn(query, conditions, request){ query.distinct() } } } },
  create: { method: 'POST', path: '/save/', handler: { apiCreate: { modelName: 'Client' } } },
  update: { method: 'PUT', path: '/save/{id}', handler: { apiUpdate: { modelName: 'Client' } } },
  destroy: { method: 'DELETE', path: '/destroy/{id}', handler: { apiDestroy: { modelName: 'Client' } } },
  bulkDestroy: { method: 'DELETE', path: '/bulk-destroy', handler: { apiBulkDestroy: { modelName: 'Client' } } },
  bulkCreate: { method: 'POST', path: '/bulk-create', handler: { apiBulkCreate: { modelName: 'Client' } } },
})

let server

describe('api-route', () => {

  beforeEach(done => {
    tracker.queries.reset()
    server = provisionServer()
    done()
  })

  afterEach(done => {
    tracker.removeAllListeners('query')
    done()
  })

  describe('apiShow handler', () => {

    it('fetches a record from the db and responds with it', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        query.response([{ id: 123, name: 'foo' }])
      })

      server.inject('/show/123', res => {
        expect(res.result.id).to.equal(123)
        expect(res.result.name).to.equal('foo')
        done()
      })
    })

    it('errors on failure', done => {

      // I'm not convinced this test is actually accurate
      tracker.once('query', query => query.response([]))

      server.inject('/show/123', res => {
        expect(res.result.statusCode).to.equal(404)
        done()
      })
    })
  })

  describe('apiIndex handler', () => {

    const clients = [
      { id: 123, name: 'foo' },
      { id: 124, name: 'bar' },
      { id: 125, name: 'baz' }
    ]

    it('fetches records from the db and responds with them', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        query.response(clients)
      })

      server.inject('/index', res => {
        const payload = JSON.parse(res.payload)
        expect(payload.length).to.equal(clients.length)
        expect(payload[0].id).to.equal(clients[0].id)
        expect(payload[0].name).to.equal(clients[0].name)
        done()
      })
    })

    it('fetches the specified page of records', done => {
      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.bindings[0]).to.equal(5)
        expect(query.bindings[1]).to.equal(20)
        query.response(clients)
      })

      server.inject('/index?page=5&perPage=5', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('handles when page is not a number', done => {
      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.not.include('offset')
        expect(query.bindings[0]).to.equal(5)
        query.response(clients)
      })

      server.inject('/index?page=ham&perPage=5', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('fetches records ordered by a column', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.contain('order by "name" asc')
        query.response(clients)
      })

      server.inject('/index?order=name', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('fetches records in desc order', done => {
      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.contain('order by "name" desc')
        query.response(clients)
      })

      server.inject('/index?order=name&dir=desc', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('fetches records in asc order', done => {
      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.contain('order by "name" asc')
        query.response(clients)
      })

      server.inject('/index?order=name&dir=asc', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('ignores values other than asc and desc', done => {
      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.contain('order by "name" asc')
        query.response(clients)
      })

      server.inject('/index?order=name&dir=ham', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })

    it('calls queryFn when present', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        expect(query.sql).to.contain('select distinct "')
        query.response(clients)
      })

      server.inject('/index2', res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })
  })

  describe('apiCreate handler', () => {

    it('inserts a record and responds with it', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('insert')
        query.response([123])
      })

      server.inject({
        method: 'POST',
        url: '/save/',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.createdAt).to.exist()
        expect(payload.updatedAt).to.exist()
        expect(payload.id).to.equal(123)
        expect(payload.name).to.equal('foo')
        done()
      })
    })
  })

  describe('apiCreate handler missing foreign key', () => {

    it('inserts a record and responds with it', done => {

      // mock error to return bad request
      let err = new Error('test')
      err.code =  '23503'

      tracker.once('query', query => {
        expect(query.method).to.equal('insert')
        throw err
      })

      server.inject({
        method: 'POST',
        url: '/save/',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })
  })

  describe('apiCreate handler duplicate key violation', () => {

    it('inserts a record and responds with it', done => {

      // mock error to return bad request
      let err = new Error('test')
      err.code =  '23505'

      tracker.once('query', query => {
        expect(query.method).to.equal('insert')
        throw err
      })

      server.inject({
        method: 'POST',
        url: '/save/',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(409)
        done()
      })
    })
  })

  describe('apiCreate handler bad implementation', () => {

    it('inserts a record and responds with it', done => {

      // mock error to return bad gateway
      let err = new Error('test')
      err.code =  '23504'

      tracker.once('query', query => {
        expect(query.method).to.equal('insert')
        throw err
      })

      server.inject({
        method: 'POST',
        url: '/save/',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(502)
        done()
      })
    })
  })

  describe('apiUpdate handler', () => {

    it('updates a record and responds with it', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('update')
        query.response([{ id: 123, name: 'foo' }])
        tracker.once('query', query => {
          expect(query.method).to.equal('select')
          query.response([{ id: 123, name: 'foo' }])
        })
      })

      server.inject({
        method: 'PUT',
        url: '/save/123',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.id).to.equal(123)
        expect(payload.name).to.equal('foo')
        done()
      })
    })

    it('fails on missing record with 404', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('update')
        const err = new Error('Not found Error')
        err.name = 'NoRowsUpdatedError'
        throw err
      })

      server.inject({
        method: 'PUT',
        url: '/save/123',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(404)
        expect(res.statusCode).to.equal(404)
        done()
      })
    })

    it('fails on bad implementation', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('update')
        const err = new Error('Something Awful')
        throw err
      })

      server.inject({
        method: 'PUT',
        url: '/save/123',
        payload: { name: 'foo' }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(500)
        expect(res.statusCode).to.equal(500)
        done()
      })
    })
  })

  describe('apiDestroy handler', () => {

    it('deletes a record and responds with it', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        query.response([{ id: 123, name: 'foo' }])
        tracker.once('query', query => {
          expect(query.method).to.equal('del')
          query.response()
        })
      })

      server.inject({ method: 'DELETE', url: '/destroy/123' }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload).to.be.empty()
        done()
      })
    })

    it('deletes a record and fails as no records exists', done => {

      tracker.once('query', query => {
        expect(query.method).to.equal('select')
        query.response(null)
      })

      server.inject({ method: 'DELETE', url: '/destroy/123' }, res => {
        const payload = JSON.parse(res.payload)
        expect(payload.statusCode).to.equal(404)
        done()
      })
    })
  })

  describe('apiBulkDestroy handler', () => {
    it('deletes the records of the ids that were sent', done => {
      let q
      tracker.once('query', query => {
        q = query
        query.response([])
      })

      server.inject({
        method: 'DELETE',
        url: '/bulk-destroy',
        payload: {
          ids: [1,2,3]
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(200)
        expect(payload).to.be.empty()
        expect(q.bindings).to.include([1,2,3])
        expect(q.sql).to.include('delete from "clients" where "id" in (?')
        done()
      })
    })

    it('can return an error if the db errors', done => {
      tracker.once('query', query => {
        throw new Error('Expected Test Error')
      })

      server.inject({
        method: 'DELETE',
        url: '/bulk-destroy',
        payload: {
          ids: [1,2,3]
        }
      }, res => {
        expect(res.statusCode).to.equal(500)
        done()
      })
    })
  })

  describe('apiBulkCreate handler', () => {
    it('creates the records of the objects that were sent', done => {
      tracker.on('query', (query, step) => {
        let index = step - 1
        ;[
          function beginTransaction(){
            query.response([{}])
          },
          function createObjects() {
            query.response([123])
          },
          function commitTransaction(){
            query.response([{}])
          }
        ][index]()
      })

      server.inject({
        method: 'POST',
        url: '/bulk-create',
        payload: {
          objects: [{ id: 123 }]
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(200)
        expect(payload).to.include([123])
        done()
      })
    })

    it('returns an error if the db errors', done => {
      tracker.once('query', query => {
        throw new Error('Expected Test Error')
      })

      server.inject({
        method: 'POST',
        url: '/bulk-create',
        payload: {
          objects: [{ id: 123 }]
        }
      }, res => {
        expect(res.statusCode).to.equal(500)
        done()
      })
    })
  })

})
