exports.register = function(server, options, next) {

  server.ext('onPreResponse', function (request, reply) {
    var response = request.response;
    if (!response.isBoom) {
      return reply.continue()
    }
    // $lab:coverage:off$
    if (response.data) {
      response.output.payload.errorData = response.data
    }
    // $lab:coverage:on$
    return reply(response)
  })

  next()
}

exports.register.attributes = {
  name: 'error-data',
  version: '1.0.0'
}
