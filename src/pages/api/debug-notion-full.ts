import { NextApiRequest, NextApiResponse } from "next"
import { getRecordMap } from "src/apis"
import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { idToUuid } from "notion-utils"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pageIdEnv = process.env.NOTION_PAGE_ID
  if (!pageIdEnv) {
    return res.status(400).json({ ok: false, message: "NOTION_PAGE_ID is not set in environment." })
  }

  try {
    const uuid = idToUuid(pageIdEnv)
    const recordMap: any = await getRecordMap(pageIdEnv)
    const block = recordMap?.block || {}
  const collection = (Object.values(recordMap.collection || {})[0] as any)?.value?.value || null

    // try get page ids via collection_query first
    let pageIds = getAllPageIds(recordMap)

    // fallback scan blocks (same logic as getPosts)
    if (!pageIds || pageIds.length === 0) {
      const collectionId = recordMap.block[uuid]?.value?.value?.collection_id || collection?.id || null
      const found: string[] = []
      for (const key of Object.keys(block)) {
        const val = (block[key]?.value?.value) as any
        if (!val) continue
        // skip collection container blocks
        if (val.type === "collection_view_page" || val.type === "collection_view") continue
        if (val.collection_id && collectionId && val.collection_id === collectionId) {
          found.push(key)
          continue
        }
        if (val.parent_id && collectionId && val.parent_id === collectionId) {
          found.push(key)
          continue
        }
        if (val.parent_table && val.parent_table === "collection") {
          found.push(key)
          continue
        }
      }
      pageIds = Array.from(new Set(found))
    }

    if (!pageIds || pageIds.length === 0) {
      return res.status(200).json({ ok: true, message: "no page ids found", pageIds: [] })
    }

    const firstId = pageIds[0]
    const schema = collection?.schema || null
    const mapped = await getPageProperties(firstId, block, schema)

    return res.status(200).json({ ok: true, firstId, mapped, rawBlock: block[firstId] })
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message || String(err), stack: err.stack })
  }
}
