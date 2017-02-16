'use strict'
const _ = require('lodash')
const lab = exports.lab = require('lab').script()
const Code = require('code')
const mock = require('../../factories/server-route')
const Permissions = require('../../../app/lib/constants/Permissions')
const History = mock.bookshelf.model('History')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.it

const provisionServer = mock.configure({
  show: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      }
    },
    method: 'GET',
    path: '/thing/{id}',
    handler(request, reply) {
      reply({id: 1}).code(200)
    }
  },
  create: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      }
    },
    method: 'POST',
    path: '/thing/',
    handler(request, reply) {
      reply({
        id: 1,
        name: 'thing'
      }).code(201)
    }
  },
  update: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      }
    },
    method: 'PUT',
    path: '/thing/{id}',
    handler(request, reply) {
      reply({
        id: 1,
        name: 'thing'
      }).code(200)
    }
  },
  destroy: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      }
    },
    method: 'DELETE',
    path: '/thing/{id}',
    handler(request, reply) {
      reply({}).code(204)
    }
  },
  createWithCustomData: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      plugins: {
        'api-history-log': {
          getEntityData(request) {
            let originalData = _.get(request, 'response.source')
            return Promise.resolve({
              entity: 'CustomThing',
              entityId: 100,
              data: originalData
            })
          }
        }
      }
    },
    method: 'POST',
    path: '/thing-custom/',
    handler(request, reply) {
      reply({
        id: 1,
        name: 'thing'
      }).code(201)
    }
  },

  createWithNoHistory: {
    config: {
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      plugins: {
        'api-history-log': {
          enabled: false
        }
      }
    },
    method: 'POST',
    path: '/thing-disabled/',
    handler(request, reply) {
      reply({
        id: 1,
        name: 'thing'
      }).code(201)
    }
  }
})

let server

describe('api-history-log', () => {

  beforeEach(done => {
    server = provisionServer()
    done()
  })

  afterEach(done => {
    mock.cleanDatabase().then(() => done()).catch(done)
  })

  describe('get record', () => {
    it('doesn\'t create a history record on get', done => {
      server.inject({
        method: 'GET',
        url: '/thing/1',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') }
      }, () => {
        History.fetchAll()
          .then((data) => {
            expect(data.length).to.equal(0)
            done()
          })
          .catch((err) => {
            done(err)
          })

      })
    })
  })

  describe('create record', () => {
    it('creates a history record on post', done => {
      server.inject({
        method: 'POST',
        url: '/thing/',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') }
      }, (res) => {
        server.on({
          name: 'onSaveHistory',
          channels: res.id
        }, (data) => {
          expect(data.entity).to.equal('Thing')
          expect(data.entityId).to.equal(1)
          expect(data.data).to.include({id: 1, name: 'thing'})
          expect(data.action).to.equal('post')
          done()
        })
      })
    })
  })

  describe('update record', () => {
    it('creates a history record on put', done => {
      server.inject({
        method: 'PUT',
        url: '/thing/1',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') }
      }, (res) => {
        server.on({
          name: 'onSaveHistory',
          channels: res.id
        }, (data) => {
          expect(data.entity).to.equal('Thing')
          expect(data.entityId).to.equal(1)
          expect(data.data).to.include({id: 1, name: 'thing'})
          expect(data.action).to.equal('put')
          done()
        })
      })
    })
  })

  describe('delete record', () => {
    it('creates a history record', done => {
      server.inject({
        method: 'DELETE',
        url: '/thing/1',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') }
      }, (res) => {
        server.on({
          name: 'onSaveHistory',
          channels: res.id
        }, (data) => {
          expect(data.entity).to.equal('Thing')
          expect(data.entityId).to.equal(1)
          expect(data.data).to.be.empty()
          expect(data.action).to.equal('delete')
          done()
        })
      })
    })
  })

  describe('create record with custom entity data', () => {
    it('creates a history record with custom data', done => {
      server.inject({
        method: 'POST',
        url: '/thing-custom/',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') },
        payload: {}
      }, (res) => {
        server.on({
          name: 'onSaveHistory',
          channels: res.id
        }, (data) => {
          expect(data.entity).to.equal('CustomThing')
          expect(data.entityId).to.equal(100)
          expect(data.data).to.include({id: 1, name: 'thing'})
          expect(data.action).to.equal('post')
          done()
        })
      })
    })
  })

  describe('create record with history disabled', () => {
    it('doesn\'t create a history record', done => {
      server.inject({
        method: 'POST',
        url: '/thing-disabled/',
        headers: { authorization: 'Bearer ' + JWT.sign({ user: 'getuser', apiKey: 1 }, 'key1') },
        payload: {
          comment: 'test comment'
        }
      }, (res) => {
        server.on({
          name: 'onSaveHistory',
          channels: res.id
        }, (data) => {
          expect(data).to.be.null()
          done()
        })
      })
    })
  })
})
