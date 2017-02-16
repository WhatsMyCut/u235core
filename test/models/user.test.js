'use strict'

const MockDb = require('../fixtures/mock-db')
const tracker = MockDb.tracker
const bookshelf = MockDb.bookshelf

const lab = exports.lab = require('lab').script()
const Code = require('code')
const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

const bcrypt = require('bcrypt')
const td = require('testdouble')

describe('User', () => {
  beforeEach(done => {
    tracker.queries.reset()
    done()
  })

  afterEach(done => {
    tracker.removeAllListeners('query')
    td.reset()
    done()
  })

  describe('roles', () => {
    it('returns a Collection to the users roles that can be fetched', done => {
      const User = bookshelf.model('User')
      const u = new User()
      const rolesCollection = u.roles()
      expect(rolesCollection.relatedData.targetTableName).to.equal('roles')
      done()
    })
  })

  describe('credential', () => {
    it('returns a Model to the users credentials that can be fetched', done => {
      const User = bookshelf.model('User')
      const u = new User()
      const credentialModel = u.credential()
      expect(credentialModel.relatedData.targetTableName).to.equal('credentials')
      done()
    })
  })

  describe('updatePassword', () => {
    it('save the users credential with a new password', done => {
      let passwordHash = 'fakehash'
      let newPasswordHash

      tracker.on('query', function sendResult(query, step) {
        let index = step - 1

        let mockQueries = [
          function credentialsFetchQuery() {
            query.response([{ id: 1, passwordHash }])
          },
          function credentialSaveQuery() {
            // assume the binding index
            newPasswordHash = query.bindings[1]
            query.response([1])
          }
        ]

        mockQueries[index]()
      })

      const User = bookshelf.model('User')
      let user = new User()

      user.updatePassword('hamsandwiches').then((value) => {
        // the user is returned
        expect(value).to.equal(user)
        // the query to save credentials sets the new password hash
        // assert the new password hash is a hash of the password passed to the method
        expect(bcrypt.compareSync('hamsandwiches', newPasswordHash)).to.equal(true)
        done()
      })
    })
  })

  describe('isValidPassword', () => {
    let bowlingHashed = '$2a$10$JR1YfTlM8K6SapDejHMxG.B1qnYtCVekVIh9HZxwpy6rbaJodKorq'

    it('returns true when the password is hashed and matches the credential passwordHash', done => {
      tracker.once('query', function sendResult(query) {
        query.response([{ passwordHash: bowlingHashed }])
      })

      const User = bookshelf.model('User')
      new User().isValidPassword('bowling').then(isValid => {
        expect(isValid).to.equal(true)
        done()
      })
    })

    it('returns false when the password is hashed and does not match the credential passwordHash', done => {
      tracker.once('query', function sendResult(query) {
        query.response([{ passwordHash: bowlingHashed }])
      })

      const User = bookshelf.model('User')
      new User().isValidPassword('bowlin').then(isValid => {
        expect(isValid).to.equal(false)
        done()
      })
    })

    it('returns false when a password is not provided', done => {
      const User = bookshelf.model('User')
      new User().isValidPassword().then(isValid => {
        expect(isValid).to.equal(false)
        done()
      })
    })
  })

  describe('createWithCredentialsAndApiKey', () => {
    it('creates a credential, user, and api key', done => {
      const User = bookshelf.model('User')

      tracker.on('query', function sendResult(query, step) {
        let index = step - 1

        let mockQueries = [
          function beginTransaction(){
            query.response([{}])
          },
          function credentialSaveQuery() {
            query.response([1])
          },
          function userSaveQuery() {
            query.response([123])
          },
          function apiKeySaveQuery() {
            query.response([1])
          },
          function commitTransaction(){
            query.response([{}])
          }
        ]

        mockQueries[index]()
      })

      let email = 'jeff.lebowski@example.com'
      let password = 'bowling'

      new User({ email }).createWithCredentialsAndApiKey({username: email, password: password} ).then(user => {
        expect(user.get('email')).to.equal(email)
        expect(user.get('id')).to.equal(123)
        done()
      })
    })
  })
})
