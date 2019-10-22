
/**
 * get all the routes of entity's foreign keys.
 * { author: user, comments: { result: [ comment ] } }
 * =>
 * allRoutes = [
 *   { entity: user, path: [ 'author' ] },
 *   { entity: comment, path: [ 'comments', 'result' ], isArray: true }
 * ]
 */
function getRoutesFromNested (obj, paths, allRoutes) {
  if (obj instanceof Entity) {
    allRoutes.push({ entity: obj, path: paths })
  } else if (Array.isArray(obj) && obj.length === 1 && obj[0] instanceof Entity) {
    allRoutes.push({ entity: obj[0], path: paths, isArray: true })
  } else {
    for (const key in obj) {
      getRoutesFromNested(obj[key], [...paths, key], allRoutes)
    }
  }
}

class Entity {
  constructor (name, entityParams = {}, { idAttribute = 'id' } = { idAttribute: 'id' }) {
    this.entityName = name
    this.idAttribute = idAttribute
    this.entityParams = {}
    this.define(entityParams)
  }

  define (entityParams) {
    this.entityParams = { ...this.entityParams, ...entityParams }
    this.foreignKeysRoutes = []
    getRoutesFromNested(entityParams, [], this.foreignKeysRoutes)
  }

  getName () {
    return this.entityName
  }

  getIdAttribute () {
    return this.idAttribute
  }

  getForeignKeysRoutes () {
    return [...this.foreignKeysRoutes]
  }
}

export {
  Entity
}
