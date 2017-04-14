'use strict'
const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const crypto = require('crypto')

const encrypt = (text, password) => {
  let cipher = crypto.createCipher('aes-256-ctr', password)
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
}

exports.seed = Promise.coroutine(function *(knex) {
  const now = new Date()
  const example = fs.readFileSync(path.join(__dirname, '../../.env.example'))
  const config = dotenv.parse(example)
  let SERVICE_SECRET_ENCRYPTION_KEY = config.SERVICE_SECRET_ENCRYPTION_KEY
  let key = '65041296-e9d1-4aa4-be53-82b6bbd1ad32'
  let secret = 'e45be021-3451-4361-8cff-e243abdec1c0'

  return knex('service_credentials').insert({
    description: 'Development Shared Service Credentials',
    key: key,
    secret: encrypt(secret, SERVICE_SECRET_ENCRYPTION_KEY),
    created_at: now,
    updated_at: now,
  })
})
