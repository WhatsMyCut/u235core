'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const JWT = require('jsonwebtoken')
const Promise = require('bluebird')
const server = require('../../server')
const wreck = require('wreck')

const expect = Code.expect
const describe = lab.describe
const beforeEach = lab.beforeEach
const after = lab.after
const it = lab.it
/*
describe('server_test', () => {
  it('runs', { timeout: 10000 }, done => {
    server.start().then(s => {
      let url = `http://localhost:${s.info.port}/okcomputer`
      wreck.get(url, {}, (err, response, body) => {
        if (err) { return done(err) }
        expect(body.toString()).to.contain('OKComputer')
        s.stop()
        done()
      })
    }).catch(done)
  })
})
*/