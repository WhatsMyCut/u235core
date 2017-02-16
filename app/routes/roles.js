'use strict'

const Joi = require('joi')
const Permissions = require('../lib/constants/Permissions')

module.exports = {

  show: {
    method: 'GET',
    path: '/roles/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.ROLES_READ]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiShow: { modelName: 'Role' }
      }
    }
  },

  index: {
    method: 'GET',
    path: '/roles',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.ROLES_READ]
        }
      },
      handler: {
        apiIndex: {
          collectionName: 'Roles'
        }
      }
    }
  },

  create: {
    method: 'POST',
    path: '/roles',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.ROLES_CREATE]
        }
      },
      payload: {
        output: 'data',
        parse: true
      },
      validate: {
        payload: Joi.object().keys({
          id: Joi.number().integer(),
          name: Joi.string().max(100).required()
        }).label('Role')
      },
      handler: {
        apiCreate: { modelName: 'Role' }
      }
    }
  },

  update: {
    method: 'PUT',
    path: '/roles/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.ROLES_UPDATE]
        }
      },
      payload: {
        output: 'data',
        parse: true
      },
      validate: {
        payload: Joi.object().keys({
          id: Joi.number().integer(),
          name: Joi.string().max(100).required()
        }).label('Role'),
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiUpdate: { modelName: 'Role' }
      }
    }
  },

  destroy: {
    method: 'DELETE',
    path: '/roles/{id}',
    config: {
      tags: ['api'],
      auth: {
        mode: 'required',
        strategy: 'jwt',
        access: {
          scope: [Permissions.SYSTEM, Permissions.ROLES_DELETE]
        }
      },
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      },
      handler: {
        apiDestroy: { modelName: 'Role' }
      }
    }
  }
}
