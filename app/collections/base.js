module.exports = function(bookshelf) {

  return bookshelf.Collection.extend({
    model: bookshelf.model('Base')
  }, {

    pageDefault: 1,
    perPageDefault: 50,
    orderDefault: '',
    dirDefault: 'asc'

  })
}
