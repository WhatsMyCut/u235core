'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const mock = require('../factories/server-route')

const RolesRoute = require('../../app/routes/roles')
const provisionServer = mock.configure(RolesRoute)
const RoleFactory = require('../factories/role')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('roles route', () => {

  beforeEach(done => {
    server = provisionServer()
    done()
  })

  afterEach(done => {
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  describe('show', () => {

    beforeEach(done => {
      done()
    })

    it('fetches a record from the db and responds with it', done => {

      Promise.coroutine(function *(){
        let role = yield RoleFactory.create()

        server.inject({
          method: 'GET',
          url: `/roles/${role.get('id')}`,
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(role.get('id'))
          expect(payload.name).to.equal(role.get('name'))
          done()
        })
      })()

    })

    it('attempts to fetch a non existant record and returns 404', done => {

      server.inject({
        method: 'GET',
        url: '/roles/321',
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

        yield RoleFactory.create()
        yield RoleFactory.create()
        yield RoleFactory.create()

        server.inject({
          method: 'GET',
          url: '/roles',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.be.at.least(3)
          done()
        })
      })()
    })

    it('fetches the specified page of records', done => {

      Promise.coroutine(function *(){

        yield RoleFactory.create()
        yield RoleFactory.create()
        yield RoleFactory.create()

        server.inject({
          method: 'GET',
          url: '/roles?page=0&per_page=5',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.be.at.least(3)
          done()
        })
      })()
    })

    it('fetches records in desc order', done => {

      Promise.coroutine(function *(){

        yield RoleFactory.create()
        yield RoleFactory.create()
        yield RoleFactory.create()

        server.inject({
          method: 'GET',
          url: '/roles?order=name&dir=desc',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.be.at.least(3)
          done()
        })
      })()
    })
  })

  describe('create', () => {

    it('inserts a record and responds with it', done => {

      Promise.coroutine(function *(){

        server.inject({
          method: 'POST',
          url: '/roles',
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
            name: 'foo'
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.name).to.equal('foo')
          done()
        })
      })()
    })

    it('inserts a record with missing name and fails with a 400 error', done => {

      Promise.coroutine(function *(){

        server.inject({
          method: 'POST',
          url: '/roles',
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(res.statusCode).to.equal(400)
          expect(payload.statusCode).to.equal(400)
          done()
        })
      })()
    })
  })

  describe('update', () => {

    it('updates a record and responds with it', done => {

      Promise.coroutine(function *(){
        let role = yield RoleFactory.create()

        server.inject({
          method: 'PUT',
          url: `/roles/${role.get('id')}`,
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
            name: 'foo1'
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(role.get('id'))
          expect(payload.name).to.equal('foo1')
          done()
        })
      })()
    })

    it('updates a record with missing name and fails with a 400 error', done => {

      Promise.coroutine(function *(){
        let role = yield RoleFactory.create()

        server.inject({
          method: 'PUT',
          url: `/roles/${role.get('id')}`,
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(res.statusCode).to.equal(400)
          expect(payload.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('Updates a nonexistent record and responds with a 404 error', done => {

      server.inject({
        method: 'PUT',
        url: '/roles/321',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
        payload: {
          name: 'foo'
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(404)
        expect(payload.statusCode).to.equal(404)
        done()
      })
    })
  })

  describe('destroy', () => {

    it('deletes a record and responds with it', done => {

      Promise.coroutine(function *(){
        let role = yield RoleFactory.create()

        server.inject({
          method: 'DELETE',
          url: `/roles/${role.get('id')}`,
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload).to.be.empty()
          done()
        })
      })()
    })

    it('tries to delete a non existant record and responds with 404', done => {

      server.inject({
        method: 'DELETE',
        url: '/roles/321',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(404)
        expect(payload.statusCode).to.equal(404)
        done()
      })
    })
  })
})
