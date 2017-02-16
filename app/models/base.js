const _ = require('lodash')

module.exports = function(bookshelf) {

  return bookshelf.Model.extend({

    hasTimestamps: true,

    parse(attrs) {
      return _.mapKeys(attrs, (val, key) => _.camelCase(key))
    },

    format(attrs) {
      return _.mapKeys(attrs, (val, key) => _.snakeCase(key))
    }
  }, {

  })
}
