// return a updated object without modifying the original one.
function updateObjectByRoute (obj, attrs, getValueFn) {
  if (attrs.length === 1) {
    const newValue = getValueFn(obj[attrs[0]])
    return { ...obj, [attrs[0]]: newValue }
  } else {
    return { ...obj, [attrs[0]]: updateObjectByRoute(obj[attrs[0]], attrs.slice(1), getValueFn) }
  }
}

function pathReachable (obj, path) {
  let pointer = obj
  for (const attr of path) {
    if (typeof pointer === 'object' && pointer.hasOwnProperty(attr)) {
      pointer = pointer[attr]
    } else {
      return false
    }
  }
  return true
}

// for detecting circular references
class ProcessedEntitiesMap {
  constructor () {
    this.entities = {}
  }

  hasEntity (entity, id) {
    const entityName = entity.getName()
    return this.entities.hasOwnProperty(entityName) && this.entities[entityName].hasOwnProperty(id)
  }

  getEntity (entity, id) {
    const entityName = entity.getName()
    if (this.hasEntity(entity, id)) {
      return this.entities[entityName][id]
    }
  }

  setEntity (entity, id, obj) {
    const entityName = entity.getName()
    if (!this.entities.hasOwnProperty(entityName)) {
      this.entities[entityName] = {}
    }
    this.entities[entityName][id] = obj
  }
}

function isCircularReferences (processedEntities, entity, id) {
  return processedEntities.hasEntity(entity, id)
}

function wrapEntities (entities) {
  return {
    getEntity: function (entity, id) {
      const entityName = entity.getName()
      if (entities.hasOwnProperty(entityName) && entities[entityName].hasOwnProperty(id)) {
        return entities[entityName][id]
      }
    },
    setEntity: function (entity, id, data) {
      const name = entity.getName()
      if (entities[name] === undefined) {
        entities[name] = {}
      }
      entities[name][id] = data
    }
  }
}

export {
  updateObjectByRoute,
  pathReachable,
  ProcessedEntitiesMap,
  isCircularReferences,
  wrapEntities
}
