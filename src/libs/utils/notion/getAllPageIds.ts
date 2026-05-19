import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  // Try collection_query first (older Notion pages)
  const collectionQuery = response.collection_query
  const views = Object.values(collectionQuery || {})[0]

  if (views) {
    let pageIds: ID[] = []
    if (viewId) {
      const vId = idToUuid(viewId)
      pageIds = (views as any)[vId]?.blockIds ?? []
    } else {
      const pageSet = new Set<ID>()
      Object.values(views).forEach((view: any) => {
        view?.collection_group_results?.blockIds?.forEach((id: ID) =>
          pageSet.add(id)
        )
        view?.blockIds?.forEach((id: ID) => pageSet.add(id))
      })
      pageIds = [...pageSet]
    }
    if (pageIds.length > 0) return pageIds
  }

  // Fallback: use page_sort from collection_view (newer Notion pages)
  const collectionView = response.collection_view
  if (collectionView) {
    const views = Object.values(collectionView)
    for (const view of views) {
      const pageSort = (view as any)?.value?.page_sort
      if (pageSort && pageSort.length > 0) {
        return pageSort as ID[]
      }
    }
  }

  return []
}
