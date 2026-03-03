import { currentUser } from "@clerk/nextjs/server"

interface UserMetadata {
  plan?: string
  stripeSubscriptionId?: string
}

function isPro(metadata: UserMetadata): boolean {
  return metadata.plan === "pro" || !!metadata.stripeSubscriptionId
}

export async function getIsProUser(): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false
    return isPro(user.publicMetadata as UserMetadata)
  } catch {
    return false
  }
}

export async function getUserPlan(): Promise<"pro" | "free" | "anonymous"> {
  try {
    const user = await currentUser()
    if (!user) return "anonymous"
    return isPro(user.publicMetadata as UserMetadata) ? "pro" : "free"
  } catch {
    return "anonymous"
  }
}
