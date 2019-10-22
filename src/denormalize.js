import { Entity } from './schema'
import {
  updateObjectByRoute,
  pathReachable,
  ProcessedEntitiesMap,
  isCircularReferences,
  wrapEntities
} from './utils'

export default function denormalize (result, entity, entities) {
  if (!result) {
    return result
  }

  if (Array.isArray(result) && Array.isArray(entity) && entity.length === 1) {
    entity = entity[0]
  }

  const getEntity = wrapEntities(entities).getEntity
  const processedEntities = new ProcessedEntitiesMap()

  return traverseDataByRoute(result, entity, getEntity, processedEntities)
}

function traverseDataByRoute (id, entity, getEntity, processedEntities) {
  if (!(entity instanceof Entity)) {
    throw new Error('cannot denormalize without a schema')
  }

  if (!id) {
    return undefined
  }

  if (Array.isArray(id)) {
    return id.map(singleId => traverseDataByRoute(singleId, entity, getEntity, processedEntities))
  }

  const data = getEntity(entity, id)

  if (!data) {
    return undefined
  }

  if (isCircularReferences(processedEntities, entity, id)) {
    // get the entity's reference and return it.
    return processedEntities.getEntity(entity, id)
  }

  // mark this entity as processed and store its reference.
  const denormalizedEntityReference = {}
  processedEntities.setEntity(entity, id, denormalizedEntityReference)

  let updatedData = { ...data }
  const routes = entity.getForeignKeysRoutes()

  for (const route of routes) {
    if (pathReachable(data, route.path)) {
      const updater = (updateId) => traverseDataByRoute(updateId, route.entity, getEntity, processedEntities)
      updatedData = updateObjectByRoute(updatedData, route.path, updater)
    }
  }

  // put the updated data into this entity‘s reference.
  Object.assign(denormalizedEntityReference, updatedData)

  return denormalizedEntityReference
}
