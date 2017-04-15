'use strict'
let _ = require('lodash')

const fieldsToSchema = (args) => {
  let fields = args.fields
  let fieldGroups = args.fieldGroups
  let details = args.details
  let programFields = args.programFields

  let schema = {
    type: 'object',
    properties: {}
  }

  let keyedFieldGroups
  if (Array.isArray(fieldGroups)) {
    keyedFieldGroups = _.keyBy(fieldGroups, 'id')
  } else {
    keyedFieldGroups = fieldGroups
  }
  let keyedProgramFields = _.keyBy(programFields, 'fieldId')
  let keyedDetails = _.keyBy(details, 'programFieldId')
  let sortedFields = _.sortBy(fields, f => f.sort)

  // generate the schema!
  _.each(sortedFields, field => {
    let group = keyedFieldGroups[field.fieldGroupId]
    let groupType = group.type.toLowerCase()
    let pf = keyedProgramFields[field.id]
    let details = pf ? keyedDetails[pf.id] : null
    let fieldTitle = details ? details.displayFieldName : field.name

    _.set(schema, `properties.${group.key}.type`, groupType)
    _.set(schema, `properties.${group.key}.title`, group.name)
    if (groupType === 'object') {
      // append the field key to the required array if the details specify the field as required
      if (details && details.required) {
        let requiredPath = `properties.${group.key}.required`
        if (!Array.isArray(_.get(schema, requiredPath))) {
          _.set(schema, requiredPath, [])
        }
        _.get(schema, requiredPath).push(field.key)
      }

      _.set(schema, `properties.${group.key}.properties.${field.key}`, field.schema)
      _.set(schema, `properties.${group.key}.properties.${field.key}.title`, fieldTitle)
    } else if (groupType === 'array') {
      // append the field key to the required array if the details specify the field as required
      if (details && details.required) {
        let requiredPath =`properties.${group.key}.items.required`
        if (!Array.isArray(_.get(schema, requiredPath))) {
          _.set(schema, requiredPath, [])
        }
        _.get(schema, requiredPath).push(field.key)
      }

      _.set(schema, `properties.${group.key}.items.type`, 'object')
      _.set(schema, `properties.${group.key}.items.properties.${field.key}`, field.schema)
      _.set(schema, `properties.${group.key}.items.properties.${field.key}.title`, fieldTitle)
    } else {
      throw new Error('Unsupported group type')
    }
  })

  return schema
}

module.exports = fieldsToSchema
