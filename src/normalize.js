import { Entity } from './schema'
import {
  updateObjectByRoute,
  pathReachable,
  ProcessedEntitiesMap,
  isCircularReferences,
  wrapEntities
} from './utils'

export default function normalize (originalData, entity) {
  if (originalData === null || typeof originalData !== 'object') {
    throw new Error('original data need to be an object or array!')
  }

  if (Array.isArray(originalData) && Array.isArray(entity) && entity.length === 1) {
    entity = entity[0]
  }

  const entities = {}
  const setEntity = wrapEntities(entities).setEntity
  const processedEntities = new ProcessedEntitiesMap()
  const result = traverseDataByRoute(originalData, entity, setEntity, processedEntities)

  return { result, entities }
}

function traverseDataByRoute (data, entity, setEntity, processedEntities) {
  if (!(entity instanceof Entity)) {
    throw new Error('cannot normalize without a schema')
  }

  if (data === null || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(singleData => {
      return traverseDataByRoute(singleData, entity, setEntity, processedEntities)
    })
  }

  const id = data[entity.getIdAttribute()]
  if (isCircularReferences(processedEntities, entity, id)) {
    return id
  }

  // mark this entity as processed, without storing the data.
  processedEntities.setEntity(entity, id, {})

  let updatedData = { ...data }
  const routes = entity.getForeignKeysRoutes()
  for (const route of routes) {
    if (pathReachable(data, route.path)) {
      // traverse deeper before return the new value
      const updater = (obj) => traverseDataByRoute(obj, route.entity, setEntity, processedEntities)
      updatedData = updateObjectByRoute(updatedData, route.path, updater)
    }
  }

  setEntity(entity, id, updatedData)

  return id
}
