import Feed from "src/routes/Feed"
import { CONFIG } from "../../site.config"
import { NextPageWithLayout } from "../types"
import { getPosts } from "../apis"
import MetaConfig from "src/components/MetaConfig"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"
import { GetStaticProps } from "next"
import { dehydrate } from "@tanstack/react-query"
import { filterPosts } from "src/libs/utils/notion"

export const getStaticProps: GetStaticProps = async () => {
  const raw = await getPosts()
  // server-side debug logs: show counts and sample keys to help diagnose missing posts
  // These logs will appear in Vercel build logs during getStaticProps execution
  try {
    console.log(`[getStaticProps] raw posts fetched: ${raw?.length ?? 0}`)
    if (raw && raw.length > 0) {
      const sample = raw[0]
      console.log(
        `[getStaticProps] sample raw post keys: ${Object.keys(sample).join(", ")}`
      )
    }
  } catch (e) {
    console.log("[getStaticProps] failed to log raw posts", e)
  }

  const posts = filterPosts(raw)
  console.log(`[getStaticProps] posts after filter: ${posts.length}`)
  await queryClient.prefetchQuery(queryKey.posts(), () => posts)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: CONFIG.revalidateTime,
  }
}

const FeedPage: NextPageWithLayout = () => {
  const meta = {
    title: CONFIG.blog.title,
    description: CONFIG.blog.description,
    type: "website",
    url: CONFIG.link,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Feed />
    </>
  )
}

export default FeedPage
