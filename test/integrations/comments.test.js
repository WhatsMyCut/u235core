'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const mock = require('../factories/server-route')

const CommentsRoute = require('../../app/routes/comments')
const provisionServer = mock.configure(CommentsRoute)
const CommentFactory = require('../factories/comment')
const UserFactory = require('../factories/user')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

let server
let createHeaders = () => ({ authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  })

describe('comments route', () => {

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

        let records = yield CommentFactory.createWithDependencies()
        let comment = records.comment

        server.inject({
          method: 'GET',
          url: `/comments/${comment.get('id')}`,
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.id).to.equal(comment.get('id'))
          expect(payload.comment).to.equal(comment.get('comment'))
          done()
        })
      })()
    })

    it('attempts to fetch a non existant record and returns 404', done => {

      server.inject({
        method: 'GET',
        url: '/comments/321',
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

        let records = yield CommentFactory.createWithDependencies()
        let comment = records.comment
        yield CommentFactory.createWithDependencies()
        yield CommentFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/comments',
          headers: createHeaders()
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.length).to.equal(3)
          expect(payload[0].id).to.equal(comment.get('id'))
          expect(payload[0].comment).to.equal(comment.get('comment'))
          done()
        })
      })()
    })

    it('fetches the specified page of records', done => {

      Promise.coroutine(function *(){

        yield CommentFactory.createWithDependencies()
        yield CommentFactory.createWithDependencies()
        yield CommentFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/comments?page=0&per_page=5',
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

        yield CommentFactory.createWithDependencies()
        yield CommentFactory.createWithDependencies()
        yield CommentFactory.createWithDependencies()

        server.inject({
          method: 'GET',
          url: '/comments?order=comment&dir=desc',
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

      Promise.coroutine(function *(){
        let user = yield UserFactory.create()

        server.inject({
          method: 'POST',
          url: '/comments',
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
            comment: 'foo',
            reportedBy: user.get('id')
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(payload.comment).to.equal('foo')
          expect(payload.reportedBy).to.equal(user.get('id'))
          done()
        })
      })()
    })

    it('inserts a record with missing comment and fails with a 400 error', done => {

      Promise.coroutine(function *(){
        let user = yield UserFactory.create()

        server.inject({
          method: 'POST',
          url: '/comments',
          headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
          payload: {
            reportedBy: user.get('id')
          }
        }, res => {
          const payload = JSON.parse(res.payload)
          expect(res.statusCode).to.equal(400)
          expect(payload.statusCode).to.equal(400)
          done()
        })
      })()
    })

    it('inserts a record with missing exception reported by and fails with a 400 error', done => {

      server.inject({
        method: 'POST',
        url: '/comments',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'admin', apiKey: 1 }, 'key1')  },
        payload: {
          comment: 'foo'
        }
      }, res => {
        const payload = JSON.parse(res.payload)
        expect(res.statusCode).to.equal(400)
        expect(payload.statusCode).to.equal(400)
        done()
      })
    })
  })
})
