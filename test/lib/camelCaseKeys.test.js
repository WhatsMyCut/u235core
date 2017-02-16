'use strict'

const lab = exports.lab = require('lab').script()
const Code = require('code')
const expect = Code.expect
const describe = lab.describe
const it = lab.it

const camelCaseKeys = require('../../app/lib/camelCaseKeys')

describe('camelCaseKeys', () => {
  it('returns a new object with camelCased keys', done => {
    let obj = { CAMEL: 'humps' }
    let r = camelCaseKeys(obj)
    expect(r.camel).to.exist()
    expect(r.CAMEL).not.to.exist()
    expect(obj.CAMEL).to.exist()
    done()
  })
})
