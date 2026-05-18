import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "src/apis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = await getPosts()
    return res.status(200).json({ ok: true, count: raw.length, sample: raw.slice(0, 5) })
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message || String(err) })
  }
}
