'use strict'
const winston = require('winston')
const CloudWatchTransport = require('winston-aws-cloudwatch')

const LOG_LEVEL = 'debug'

const createLogger = () => {
  let transports = []
  // $lab:coverage:off$
  // only run in production
  if (process.env.NODE_ENV === 'production') {
    transports = [
      new CloudWatchTransport({
        level: LOG_LEVEL,
        logGroupName: process.env.LOG_GROUP_NAME,
        logStreamName: process.env.LOG_STREAM_NAME,
        createLogGroup: true,
        createLogStream: true,
        awsConfig: { region: 'us-east-1' }
      })
    ]
  }
  // $lab:coverage:on$
  // only run in production

  let logger = new winston.Logger({ transports: transports })

  // log to stdout when there are errors
  logger.on('error', err => {
    // $lab:coverage:off$
    console.log(err)
    // $lab:coverage:on$
  })

  return logger
}

module.exports = createLogger
