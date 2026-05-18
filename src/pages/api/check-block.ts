import { NextApiRequest, NextApiResponse } from "next"
import { getRecordMap } from "src/apis"
import { idToUuid } from "notion-utils"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, message: "Provide ?id=<page-id-or-uuid>" })
  }

  const pageIdEnv = process.env.NOTION_PAGE_ID
  if (!pageIdEnv) {
    return res.status(400).json({ ok: false, message: "NOTION_PAGE_ID is not set in environment." })
  }

  try {
    const recordMap: any = await getRecordMap(pageIdEnv)
    const block = recordMap?.block || {}
    const uuid = idToUuid(id)
    const existsEnv = !!block[id]
    const existsUuid = !!block[uuid]

    const result: any = { ok: true, queryId: id, uuid, existsEnv, existsUuid }
    if (existsEnv) result.block = block[id]
    if (existsUuid) result.blockUuid = block[uuid]

    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message || String(err) })
  }
}
