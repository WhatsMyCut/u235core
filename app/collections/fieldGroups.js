module.exports = function(base, bookshelf) {
  return base.extend({
    model: bookshelf.model('FieldGroup')
  })
}
