'use strict'

const AWS = require('aws-sdk')
const Lambda = new AWS.Lambda()
const Promise = require('bluebird')
const Permissions = require('../lib/constants/Permissions')
const _ = require('lodash')

// $lab:coverage:off$

module.exports = {

  index: {
    method: 'GET',
    path: '/lambdas',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM]
        }
      },
      timeout: {
        server: 30000
      },
      handler: Promise.coroutine(function *(req, reply){
        let awsLambdaFunctions = yield Lambda.listFunctions().promise()
        let lambdas = []

        for (let f of awsLambdaFunctions.Functions) {
          if (f.Environment && _.get(f.Environment, 'Variables.TYPE') == 'PROGRAM_PROCESSING') {
            let version = 0
            let lambda = {}

            if (f.Version == '$LATEST') {
              let awsLambdaVersion = yield Lambda.listVersionsByFunction( { FunctionName: f.FunctionName }).promise()
              while (awsLambdaVersion.NextMarker) {
                awsLambdaVersion = yield Lambda.listVersionsByFunction( { Marker: awsLambdaVersion.NextMarker, FunctionName: f.FunctionName }).promise()
              }

              version = Number(awsLambdaVersion.Versions[awsLambdaVersion.Versions.length - 1].Version)
            } else {
              version = Number(f.Version)
            }

            lambda.functionName = f.FunctionName
            lambda.version = version

            let configurationSchema = _.get(f.Environment, 'Variables.CONFIGURATION_SCHEMA')
            if (configurationSchema) {
              configurationSchema = Buffer.from(configurationSchema, 'base64')
              lambda.configurationSchema = JSON.parse(configurationSchema.toString())
            }

            let processingConfiguration = _.get(f.Environment, 'Variables.PROCESSING_CONFIGURATION')
            if (processingConfiguration) {
              processingConfiguration = Buffer.from(processingConfiguration, 'base64')
              lambda.processingConfiguration = JSON.parse(processingConfiguration.toString())
            }

            lambdas.push(lambda)
          }
        }

        reply(lambdas)
      })
    }
  },

}
// $lab:coverage:on$
