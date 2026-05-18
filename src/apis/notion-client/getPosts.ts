import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"
import { CustomExtendedRecordMap } from "src/types/notion.type"


/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */


// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  if (!id) {
    throw new Error(
      "NOTION_PAGE_ID is not set. Set the NOTION_PAGE_ID env variable to your Notion page id (not the full URL)."
    )
  }

  const api = new NotionAPI()

  let response: CustomExtendedRecordMap | null = null
  try {
    response = (await api.getPage(id)) as any as CustomExtendedRecordMap
  } catch (err) {
    // surface a clearer error during build/runtime
    // eslint-disable-next-line no-console
    console.error("Failed to fetch Notion page:", err)
    throw new Error(
      `Failed to fetch Notion page for NOTION_PAGE_ID=${id}. Ensure the page is shared to web and the ID is correct.`
    )
  }
  id = idToUuid(id)
  const collection = Object.values(response.collection || {})[0]?.value.value
  const block = response.block
  const schema = collection?.schema
  const rawMetadata = block[id].value
  // Check Type
  if (
    rawMetadata?.value.type !== "collection_view_page" &&
    rawMetadata?.value.type !== "collection_view"
  ) {
    return []
  } else {
    // Construct Data
    let pageIds = getAllPageIds(response)

    // Fallback: if collection_query is empty (pageIds === 0), try to find pages by scanning blocks
    // Some Notion record maps don't populate collection_query; in that case find blocks whose
    // parent_id or collection_id matches the collection's id
    if (!pageIds || pageIds.length === 0) {
      try {
        const collectionId = rawMetadata?.value?.collection_id || collection?.id || null
        const blockKeys = Object.keys(block || {})
        const found: string[] = []
        for (let i = 0; i < blockKeys.length; i++) {
          const key = blockKeys[i]
          const val = block[key]?.value?.value
          if (!val) continue
          // prefer explicit collection_id on the block
          if ((val as any).collection_id && collectionId && (val as any).collection_id === collectionId) {
            found.push(key)
            continue
          }
          // check parent_id or parent_table indicating it's part of the collection
          if ((val as any).parent_id && collectionId && (val as any).parent_id === collectionId) {
            found.push(key)
            continue
          }
          if ((val as any).parent_table && (val as any).parent_table === "collection") {
            found.push(key)
            continue
          }
        }

        if (found.length > 0) {
          // Use unique keys
          pageIds = Array.from(new Set(found))
          // eslint-disable-next-line no-console
          console.warn(`[getPosts] fallback found ${pageIds.length} page ids from blocks`)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[getPosts] fallback scanning blocks failed", e)
      }
    }
    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties = (await getPageProperties(id, block, schema)) || null
      // Add fullwidth, createdtime to properties
      properties.createdTime = new Date(
        block[id].value.value?.created_time
      ).toString()
      properties.fullWidth =
        (block[id].value.value?.format as any)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  }
}
