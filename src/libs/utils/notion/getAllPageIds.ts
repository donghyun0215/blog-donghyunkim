import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  const collectionQuery = response.collection_query
  const views = Object.values(collectionQuery)[0]

  if (!views) return []

  let pageIds: ID[] = []

  if (viewId) {
    const vId = idToUuid(viewId)
    pageIds = views[vId]?.blockIds ?? []
  } else {
    const pageSet = new Set<ID>()

    Object.values(views).forEach((view: any) => {
      // Grouped view (e.g. board, grouped gallery)
      view?.collection_group_results?.blockIds?.forEach((id: ID) =>
        pageSet.add(id)
      )
      // Standard table/list/gallery view ← this was missing
      view?.blockIds?.forEach((id: ID) => pageSet.add(id))
    })

    pageIds = [...pageSet]
  }

  return pageIds
}
