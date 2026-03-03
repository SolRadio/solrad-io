import { redirect } from "next/navigation"

/**
 * Compatibility redirect handler for query-based token links
 * Redirects /token?mint=X or /token?address=X to /token/X
 * This ensures old-style links and share links work correctly
 */
export default async function TokenRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  // Extract mint from various possible query params
  const mint =
    (resolvedParams?.mint as string) ||
    (resolvedParams?.address as string) ||
    (resolvedParams?.token as string) ||
    ""

  // If we have a mint, redirect to canonical route
  if (mint && typeof mint === "string") {
    redirect(`/token/${mint}`)
  }

  // No mint provided - redirect to dashboard
  redirect("/")
}
