'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')

const mock = require('../factories/server-route')
const UserFactory = require('../factories/user')
const RoleFactory = require('../factories/role')
const Permissions = require('../../app/lib/constants/Permissions')
const UsersRoute = require('../../app/routes/users')
const provisionServer = mock.configure(UsersRoute)

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it
const td = require('testdouble')

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('users route', () => {
  beforeEach(done => {
    server = provisionServer()
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  afterEach(done => {
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  describe('create', () => {
    let email = 'jeff.lebowski@example.com'
    let password = 'bowling'
    let firstName = 'Jeff'
    let lastName = 'Lebowski'
    let validPayload = { email, firstName, lastName, password}

    it('inserts a record and responds with it', done => {
      server.inject({
        method: 'POST',
        url: '/users',
        headers: createHeaders(),
        payload: validPayload
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(201)
        expect(payload.email).to.equal(validPayload.email)
        expect(payload.firstName).to.equal(validPayload.firstName)
        expect(payload.lastName).to.equal(validPayload.lastName)
        expect(payload.password).to.not.exist()
        done()
      })
    })

    it('inserts a record with missing name and fails with a 400 error', done => {
      server.inject({
        method: 'POST',
        url: '/users',
        headers: createHeaders(),
        payload: {}
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })
/*
    it('inserts a conflicting record and fails with 409 error', done => {
      Promise.coroutine(function *(){
        let user = yield UserFactory.create()

        server.inject({
          method: 'POST',
          url: '/users',
          headers: createHeaders(),
          payload: {
            email: user.get('email'),
            password: 'password',
            firstName: user.get('firstName'),
            lastName: user.get('lastName')
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(res.statusCode).to.equal(409)
          expect(payload.statusCode).to.equal(409)
          done()
        })
      })()
    })
*/
  })
/*
  describe('user permissions', () => {
    it('returns the list of user permissions', done => {
      Promise.coroutine(function *(){
        let { user } = yield UserFactory.createWithPermissions({}, [
          Permissions.USERS_READ,
          Permissions.USERS_UPDATE
        ])

        let r = yield RoleFactory.create()
        server.inject({
          method: 'GET',
          url: `/users/${user.id}/permissions`,
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(res.statusCode).to.equal(200)
          expect(Array.isArray(payload)).to.equal(true)
          expect(payload.length).to.equal(2)
          expect(payload[0].resource).to.equal('USERS')
          done()
        })
      })()
    })
  })
*/
  describe('update password', () => {

    let email = 'jeff.lebowski@example.com'
    let password = 'bowling'
    let confirmPassword = password
    let resetCode = 'mock-reset-code'
    let validPayload = { email, password, confirmPassword, resetCode }

    it('returns a 400 if the password and confirmPassword dont match', done => {

      Promise.coroutine(function *(){
        let user = yield UserFactory.create()

        server.inject({
          method: 'PUT',
          url: '/users/1/password',
          payload: {
            email: user.get('email'),
            password: 'password',
            confirmPassword: 'he fixes the cable',
            resetCode: 'mock-reset-code'
          }
        }, res => {
          expect(res.result.message).to.match(/do not match/)
          expect(res.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('returns 200 if the user doesnt exist', done => {

      server.inject({
        method: 'PUT',
        url: '/users/1/password',
        payload: validPayload
      }, res => {
        expect(res.statusCode).to.equal(200)
        done()
      })
    })


    it('returns 400 if the resetCode doesnt exist', done => {
      Promise.coroutine(function *(){
        let user = yield UserFactory.createWithPassword()

        server.inject({
          method: 'PUT',
          url: `/users/${user.get('id')}/password`,
          payload: {
            email: user.get('email'),
            password: 'password',
            confirmPassword: 'password',
            resetCode: 'mock-reset-code'
          }
        }, res => {
          expect(res.result.message).to.match(/does not exist/)
          expect(res.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('returns 400 if the reset is expired', done => {
      Promise.coroutine(function *(){
        let now = new Date()
        let tenMinutesBeforeNow = new Date(now.getTime() - 600 * 1e3)
        let user = yield UserFactory.createWithPassword()
        yield UserFactory.createResetCode( { id: user.get('id'), email: user.get('email'), resetExpiration: tenMinutesBeforeNow})

        server.inject({
          method: 'PUT',
          url: `/users/${user.get('id')}/password`,
          payload: {
            email: user.get('email'),
            password: 'password',
            confirmPassword: 'password',
            resetCode: 'mock-reset-code'
          }
        }, res => {
          expect(res.result.message).to.match(/has expired/)
          expect(res.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('returns 400 if the resetCode doesnt match the database', done => {
      Promise.coroutine(function *(){
        let user = yield UserFactory.createWithPassword()
        yield UserFactory.createResetCode( { id: user.get('id'), email: user.get('email')})

        server.inject({
          method: 'PUT',
          url: `/users/${user.get('id')}/password`,
          payload: {
            email: user.get('email'),
            password: 'password',
            confirmPassword: 'password',
            resetCode: 'the-wrong-reset-code'
          }
        }, res => {
          expect(res.result.message).to.match(/invalid/i)
          expect(res.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('returns success if the resetCode matchs the database', done => {
      Promise.coroutine(function *(){
        let user = yield UserFactory.createWithPassword()
        let code = yield UserFactory.createResetCode( { id: user.get('id'), email: user.get('email')})

        server.inject({
          method: 'PUT',
          url: `/users/${user.get('id')}/password`,
          payload: {
            email: user.get('email'),
            password: 'password',
            confirmPassword: 'password',
            resetCode: code.get('resetCode')
          }
        }, res => {
          expect(res.statusCode).to.equal(200)
          done()
        })
      })()
    })
  })

  describe('update resetCode', () => {
    let email = 'jeff.lebowski@example.com'

    it('returns no content if the user doesnt exist', done => {

      // make the reqest to the server
      server.inject({
        method: 'PUT',
        url: '/users/1/reset-code',
        payload: { email }
      }, res => {
        expect(res.statusCode).to.equal(204)
        done()
      })
    })

    it('saves the credential with a reset code and expiration and returns no content when everything works', done => {
      Promise.coroutine(function *(){
        let user = yield UserFactory.createWithPassword()

        server.inject({
          method: 'PUT',
          url: `/users/${user.get('id')}/reset-code`,
          payload: { email: user.get('email') }
        }, res => {
          expect(res.statusCode).to.equal(204)
          done()
        })
      })()
    })
  })
})