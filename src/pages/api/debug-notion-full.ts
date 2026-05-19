import { NextApiRequest, NextApiResponse } from "next"
import { getRecordMap } from "src/apis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pageId = process.env.NOTION_PAGE_ID!
    const recordMap: any = await getRecordMap(pageId)
    
    const collectionView = recordMap?.collection_view || {}
    const collectionViewKeys = Object.keys(collectionView)
    const firstView = collectionView[collectionViewKeys[0]]
    const pageSort = firstView?.value?.page_sort || []

    return res.status(200).json({
      ok: true,
      collectionViewKeys,
      collectionViewCount: collectionViewKeys.length,
      firstViewType: firstView?.value?.type,
      pageSortCount: pageSort.length,
      pageSortSample: pageSort.slice(0, 5),
      collectionQueryKeys: Object.keys(recordMap?.collection_query || {}),
    })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
