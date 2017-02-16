'use strict'

function resource(model, request, reply) {

  let id = request.params.id
  let db = request.server.db()

  db[model].findById(id).then(reply, reply)
}

const Helpers = {

  resource(model) {
    return {
      assign: 'resource',
      method: resource.bind(null, model)
    }
  },

  site: {
    assign: 'site',
    method: function(request, reply) {

      let siteId = request.auth.credentials.siteId
      let r = request.server.db()

      r.table('sites').get(siteId)
        .then(reply)
        .catch(Helpers.errHndlr(request, reply))
    }
  },

  errHndlr(request, reply) {
    return function(err) {
      request.log(['error', err])
      reply(err)
    }
  }

}

module.exports = Helpers
