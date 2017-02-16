const _ = require('lodash')
module.exports = (obj) => _.mapKeys(obj, (val, key) => _.camelCase(key))
