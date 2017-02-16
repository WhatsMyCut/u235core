'use strict'

const bookshelf = require('./server-route').bookshelf
const Role = bookshelf.model('Role')
let id = 1

module.exports = {
  create: function(buildAttrs) {

    let attrs = Object.assign({
      name: `Role ${id++}`,
    }, buildAttrs)

    return Role.forge(attrs).save()
  }
}
