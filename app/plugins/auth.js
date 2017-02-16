'use strict'

exports.register = function(server, options, next) {

  function validate(request, session, callback) {

    if (!session.profile.id)
      return callback(null, false)

    const User = request.db.model(options.modelName)

    new User({ id: session.profile.id }).fetch()
      .then(user => callback(null, true, user))
      .catch(err => callback(err, false))
  }

  options.strategies.forEach(opt => {

    opt.config.validateFunc = validate
    server.auth.strategy(opt.name, opt.strategy, opt.config)
  })

  if (options.defaultStrategy) {
    server.auth.default(options.defaultStrategy)
  }

  next()
}

exports.register.attributes = {
  name: 'auth',
  version: '1.0.0'
}
