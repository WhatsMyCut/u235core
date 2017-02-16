exports.register = function(server, options, next) {

  server.ext('onPostHandler', function(request, reply) {
    const resp = request.response
    const envelope = { metadata: null, error: null, result: null }

    // Plain Text and HTML responses
    if (resp.variety == 'plain' && typeof resp.source == 'string') {
      return reply.continue()
    }

    // Error response
    if (resp.isBoom) {
      envelope.error = resp.output.payload
      resp.output.payload = envelope
      return reply.continue()
    }

    // for everything else, set the content type of the response
    resp.type('application/json')

    // everything else
    envelope.result = resp.source
    resp.source = envelope
    reply.continue()
  })

  next()
}

exports.register.attributes = {
  name: 'response-envelope',
  version: '1.0.0'
}
