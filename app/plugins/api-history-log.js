'use strict'
const singularize = require('pluralize').singular
const _ = require('lodash')
const createLogger = require('../lib/createLogger')
const logger = createLogger()
const Promise = require('bluebird')

// $lab:coverage:off$
// covered by integration tests

const getEntityData = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let method = _.get(request, 'method')
      let entityData = getEntityAndIdFromPath(request.path, method)
      let entity = entityData.entity
      let entityId = entityData.entityId
      let data = _.get(request, 'response.source')
      if (method === 'post') {
        entityId = entityId || data.id || undefined
      }
      resolve({entity, entityId, data})
    } catch (err) {
      reject(err)
    }
  })
}

const getEntityAndIdFromPath = (path, method) => {
  let parsedPath = path.split('/')
  // turns /submission-steps into SubmissionStep
  let entity = _(singularize(path.split('/')[1]))
    .chain().startCase().value().replace(' ', '')
  switch (method) {
    case 'put':
    case 'delete':
      let entityId = parseInt(parsedPath[2])
      return {entity, entityId}
      break
    case 'post':
      return {entity}
      break
  }
}

const saveHistoryData = (request, userId, entityData) => {
  let historyData = {
    userId: userId,
    action: _.get(request, 'method'),
    entity: entityData.entity,
    entityId: entityData.entityId,
    data: entityData.data
  }
  let History = request.db.model('History')
  return new History(historyData).save()
}

const canSaveHistory = (request, settings, userId) => {
  let enabled = _.get(settings, 'enabled') === false ? false : true
  if (enabled
    && userId
    && Math.floor(request.response.statusCode / 100) === 2
    && ['post', 'put', 'delete'].indexOf(request.method) !== -1) {
    return true
  }
  return false
}

const emitEvent = (server, request, data) => {
  server.emit({
    name: 'onSaveHistory',
    channel: request.id
  }, data)
}

const saveApiHistory = (request, reply) => {
  return new Promise((resolve, reject) => {
    let settings = _.get(request, 'route.settings.plugins.api-history-log')
    let userId = _.get(request, 'auth.credentials.user.id')
    if (canSaveHistory(request, settings, userId)) {
      let entityDataHandler = _.get(settings, 'getEntityData') || getEntityData
      entityDataHandler(request, reply)
        .then((entityData) => {
          return saveHistoryData(request, userId, entityData)
        })
        .then((historyData) => {
          resolve(historyData.toJSON())
        })
        .catch((err) => {
          reject(err)
        })
    } else {
      resolve(null)
    }
  })
}

exports.register = function(server, options, next) {
  server.event('onSaveHistory')
  server.ext('onPreResponse', (request, reply) => {
    saveApiHistory(request, reply)
      .then(historyData => {
        emitEvent(server, request, historyData)
      })
      .catch(err => {
        emitEvent(server, request)
        logger.error(err)
      })
    reply.continue()
  })
  next()
}
// $lab:coverage:on$
// covered by integration tests

exports.register.attributes = {
  name: 'api-history-log',
  version: '1.0.0'
}
