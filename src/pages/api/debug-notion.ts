import { NextApiRequest, NextApiResponse } from "next"
import { getRecordMap } from "src/apis"
import { idToUuid } from "notion-utils"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pageIdEnv = process.env.NOTION_PAGE_ID
  if (!pageIdEnv) {
    return res.status(400).json({ ok: false, message: "NOTION_PAGE_ID is not set in environment." })
  }

  try {
    const pageIdUuid = idToUuid(pageIdEnv)
    const recordMap: any = await getRecordMap(pageIdEnv)

    const collection = recordMap?.collection || null
    const collectionQuery = recordMap?.collection_query || null
    const block = recordMap?.block || null

    const diagnostics: any = {
      ok: true,
      envPageId: pageIdEnv,
      pageIdUuid,
      hasCollection: !!collection,
      collectionKeys: collection ? Object.keys(collection).slice(0, 5) : [],
      collectionCount: collection ? Object.keys(collection).length : 0,
      hasCollectionQuery: !!collectionQuery,
      collectionQueryKeys: collectionQuery ? Object.keys(collectionQuery).slice(0, 5) : [],
      collectionQueryCount: collectionQuery ? Object.keys(collectionQuery).length : 0,
      blockCount: block ? Object.keys(block).length : 0,
    }

    // check block for provided id or uuid
    diagnostics.blockHasEnvId = !!(block && block[pageIdEnv])
    diagnostics.blockHasUuid = !!(block && block[pageIdUuid])

    // when block exists for either id, include rawMetadata.type if available
    const targetBlockKey = diagnostics.blockHasEnvId ? pageIdEnv : diagnostics.blockHasUuid ? pageIdUuid : null
    if (targetBlockKey && block && block[targetBlockKey] && block[targetBlockKey].value) {
      diagnostics.rawMetadataType = block[targetBlockKey].value.value?.type
      diagnostics.rawMetadataKeys = Object.keys(block[targetBlockKey].value.value).slice(0, 10)
    }

    return res.status(200).json(diagnostics)
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message || String(err), stack: err.stack })
  }
}
