'use strict'

const Boom = require('boom')
const Joi = require('joi')
const _ = require('lodash')
const Promise = require('bluebird')
const QS = require('qs')

const internals = {}

internals.indexQuerySchema = Joi.object({
  order: Joi.string(),
  dir: Joi.string().allow('asc', 'desc'),
  page: Joi.number().integer().min(1),
  per_page: Joi.number().integer().min(1),
  attributes: Joi.string(),
  include: Joi.string()
}).unknown()

internals.show = function(route, options) {

  return function(request, reply) {
    const id = request.params.id
    let Model = request.db.model(options.modelName)

    // $lab:coverage:off$
    return new Model({ id }).fetch(options.fetchOptions || {})
      // $lab:coverage:on$
      .then(model => {
        if (model) {
          return reply(model.toJSON())
        }
        reply(Boom.notFound())
      })
  }
}

internals.index = function(route, options) {

  const queryFn = Promise.method(options.queryFn ||
    function(query, conditions/*, context*/){
      query.where(conditions)
    })

  // allows us to modify what we return in the response, after the query
  // $lab:coverage:off$
  const selectFn = options.selectFn ||
    function(collection/*, context*/) {
      return collection.query()
    }

  const renderFn = Promise.method(options.renderFn ||
    function(collection) {
      return collection.fetch(options.fetchOptions || {})
    })

  const orderBy = Promise.method(options.orderBy ||
    function(query, conditions, context) {
      let qs = context.qs
      if (qs.order) {
        let order = _.snakeCase(qs.order)
        query.orderBy(order, qs.dir)
      }
    })
  // $lab:coverage:on$

  // TODO: attributes, include and order could come from options

  return function(request, reply) {

    const Collection = request.db.collection(options.collectionName)

    request.query = QS.parse(request.url.search.substr(1))

    // force all querystring keys to snake_case before validating
    let qs = _.mapKeys(request.query, (val, key) => _.snakeCase(key))
    qs = Joi.validate(qs, internals.indexQuerySchema).value

    // reserving attributes and include for future use.
    const conditions = _.omit(qs, 'order', 'dir', 'page', 'per_page', 'attributes', 'include')

    qs.page = qs.page || Collection.pageDefault
    // take paging parameters from the user
    if ( !_.isFinite(qs.page) || qs.page <= 0 ) {
      qs.page = 0
    } else {
      // reduce the page number by one to account for
      // one based indexing as user input
      // user inputs page = 1 and receives offset = 0
      qs.page -= 1
    }

    qs.per_page = qs.per_page || Collection.perPageDefault

    // accept an ordering field and order direction from the user
    if (!qs.order) {
      qs.order = Collection.orderDefault
    }
    let dir
    if (qs.dir) {
      dir = qs.dir.toLowerCase()
      if (dir !== 'asc' && dir !== 'desc') {
        dir = Collection.dirDefault
      }
    } else {
      dir = Collection.dirDefault
    }
    qs.dir = dir

    const collection = Collection.forge()

    let context = {
      qs: qs,
      request: request,
      collection: collection
    }

    const query = selectFn(collection, context)

    query.offset(qs.page * qs.per_page).limit(qs.per_page)

    orderBy(query, conditions, context)

    queryFn(query, conditions, context)
      .then(() => reply(renderFn(collection, query, context)))
  }
}

internals.create = function(route, options) {

  // allow for payload validation
  // $lab:coverage:off$
  const validateFn = options.validateFn ||
    function() {
      return true
    }

  const cleanupFn = options.cleanupFn ||
    function(payload) {
      return payload
    }
  // $lab:coverage:on$

  return function(request, reply) {
    const payload = request.payload
    const Model = request.db.model(options.modelName)

    // $lab:coverage:off$
    let result = validateFn(request)

    if (!result) { return reply(Boom.badRequest('Failed validation.')) }
    // $lab:coverage:on$
    cleanupFn(payload)
    new Model(payload).save()
      .then(savedModel => {
        // $lab:coverage:off$
        if (options.fetchOptions) {
          return new Model({ id: savedModel.get('id') }).fetch(options.fetchOptions)
          // $lab:coverage:on$
        } else {
          return savedModel
        }
      })
      .then(response => {
        return reply(response.parse(response.toJSON())).code(201)
      })
      .catch(function(err) {
        if (err.code === '23503'){
          // foreign key violation 23503
          return reply(Boom.badRequest(new Error('Foreign key violation')))
        }
        else if (err.code === '23505') {
          // unique key violation 23503
          return reply(Boom.conflict(new Error('Unique key violation')))
        } else {
          return reply(Boom.badGateway(err))
        }
      })
  }
}

internals.update = function(route, options) {

  // allow for payload validation
  // $lab:coverage:off$
  const validateFn = options.validateFn ||
    function() {
      return true
    }

  const cleanupFn = options.cleanupFn ||
    function(payload) {
      return payload
    }
  // $lab:coverage:on$

  return function(request, reply) {
    const id = request.params.id
    const payload = request.payload
    const Model = request.db.model(options.modelName)
    payload.id = parseInt(id, 10)

    // $lab:coverage:off$
    let result = validateFn(request)

    if (!result) { return reply(Boom.badRequest('Failed validation.')) }
    // $lab:coverage:on$

    cleanupFn(payload)
    return new Model(payload).save(null, {method: 'update'})
      .then(() => {
        return new Model({ id }).fetch()
      })
      .then((response) => {
        return reply(response)
      })
      .catch((err) => {
        //not clear here which of the below errors get thrown. Unit tests expect 'NoRowsUpdatedError',
        //integration tests receive 'CustomError'. Allow both for now.
        if (err.name === 'NoRowsUpdatedError') {
          return reply(Boom.notFound(err))
        }
        // $lab:coverage:off$
        if (err.name === 'CustomError' && err.message === 'No Rows Updated') {
          return reply(Boom.notFound(err))
        }
        // $lab:coverage:on$
        return reply(Boom.badImplementation(err))
      })
  }
}

internals.destroy = function(route, options) {

  return function(request, reply) {

    const id = request.params.id
    const Model = request.db.model(options.modelName)
    return new Model({ id }).fetch()
      .then(model => {
        if (model) {
          return reply(new Model({ id }).destroy())
        } else {
          return reply(Boom.notFound())
        }
      })
  }
}

internals.bulkCreate = function(route, options) {
  return function(req, reply) {
    // $lab:coverage:off$
    if (!options.modelName) {
      throw new Error('modelName is not defined for route')
    }
    // $lab:coverage:on$
    const knex = req.db.knex
    const Model = req.db.model(options.modelName)
    const m = Model.forge()
    const tableName = m.tableName
    let objects = req.payload.objects

    // map object keys to snake_case to conform with column names
    objects = _.map(objects, o => {
      return _.mapKeys(o, (v, k) => _.snakeCase(k))
    })

    // $lab:coverage:off$
    if (m.hasTimestamps) {
    // $lab:coverage:on$

      let now = new Date()
      // add date fields that are normally added by Bookshelf
      objects = _.map(objects, o => {
        return Object.assign(o, { created_at: now, updated_at: now })
      })
    }
    // run the inserts in a transaction and return the ids
    knex.transaction(tx => {
      let batches = _.chunk(objects, 1000)
      return Promise.all(batches.map(batch => {
        return tx.insert(batch).into(tableName).returning('id')
      }))
    }).then(ids => {
      reply(_.flatten(ids))
    }).catch(err => {
      reply(Boom.badImplementation(err))
    })
  }
}

// $lab:coverage:off$
internals.bulkUpdate = function(route, options) {
  return function(req, reply) {

    if (!options.modelName) {
      throw new Error('modelName is not defined for route')
    }

    const Model = req.db.model(options.modelName)
    const m = Model.forge()
    const ids = req.payload.ids

    const payloadParams = _.omit(req.payload, ['ids'])
    const query = m.query()

    // map object keys to snake_case to conform with column names
    let updateParams = _.mapKeys(payloadParams, (v, k) => _.snakeCase(k))

    if (m.hasTimestamps) {
      updateParams.updated_at = new Date()
    }

    return query.where('id', 'IN', ids).update(updateParams)
    .then(() => {
      reply(ids)
    }).catch(err => {
      reply(Boom.badImplementation(err))
    })
  }
}
// $lab:coverage:on$

internals.bulkDestroy = function(route, options) {
  return function(req, reply) {
    // $lab:coverage:off$
    if (!options.modelName) {
      throw new Error('modelName is not defined for route')
    }
    // $lab:coverage:on$
    const ids = req.payload.ids
    const Model = req.db.model(options.modelName)
    const query = Model.forge().query()

    query.whereIn('id', ids).del().then(() => {
      reply({})
    }).catch(err => {
      reply(Boom.badImplementation(err))
    })
  }
}

exports.register = function(server, options, next) {

  server.handler('apiShow', internals.show.bind(server))
  server.handler('apiIndex', internals.index.bind(server))
  server.handler('apiCreate', internals.create.bind(server))
  server.handler('apiUpdate', internals.update.bind(server))
  server.handler('apiDestroy', internals.destroy.bind(server))
  server.handler('apiBulkCreate', internals.bulkCreate.bind(server))
  server.handler('apiBulkUpdate', internals.bulkUpdate.bind(server))
  server.handler('apiBulkDestroy', internals.bulkDestroy.bind(server))
  next()
}

exports.register.attributes = {
  name: 'api-route',
  once: true,
  version: '1.0.0'
}
