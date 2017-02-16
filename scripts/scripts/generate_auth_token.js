'use strict'

// Useful for generating
const JWT = require('jsonwebtoken')
const secret = 'c9db3005-586f-4f88-a107-cdb4cb4f6c5c'
const apiKey = '3489907e-67dd-49ff-bd91-8c183a2e0725'


let jwtPayload = {
  id: 1,
  apiKey: apiKey,
  // About 5 years
  expiresIn: 157680000
}
let token = JWT.sign(jwtPayload, secret)
console.log(token)
